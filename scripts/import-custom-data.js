import { database, ref, set } from '../firebase';

/**
 * Sanitise un objet pour Firebase en remplaçant les caractères interdits dans les clés
 * et en remplaçant les valeurs non autorisées comme NaN, undefined, etc.
 */
const sanitizeObjectForFirebase = (obj) => {
  if (!obj || typeof obj !== 'object') {
    // Gérer les valeurs primitives
    if (obj === undefined) return null;
    if (Number.isNaN(obj)) return 0;
    return obj;
  }

  // Pour les tableaux, sanitiser chaque élément
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForFirebase(item));
  }

  // Pour les objets, sanitiser les clés et les valeurs
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remplacer les caractères interdits dans les clés
    const sanitizedKey = key
      .replace(/[\.#$\/\[\]]/g, '_') // Remplacer .#$/[] par _
      .replace(/\(/g, '_')          // Remplacer ( par _
      .replace(/\)/g, '_')          // Remplacer ) par _
      .replace(/\s+/g, '_');        // Remplacer les espaces par _

    // Sanitiser récursivement les valeurs
    let sanitizedValue = typeof value === 'object' && value !== null
      ? sanitizeObjectForFirebase(value)
      : value;
      
    // Remplacer les valeurs non autorisées par Firebase
    if (sanitizedValue === undefined) sanitizedValue = null;
    if (Number.isNaN(sanitizedValue)) sanitizedValue = 0;
      
    sanitized[sanitizedKey] = sanitizedValue;
  }

  return sanitized;
};

/**
 * Vérifie si une valeur est sûre pour Firebase (ni NaN, ni undefined)
 */
const ensureSafeValue = (value, defaultValue = 0) => {
  if (value === undefined || Number.isNaN(value)) {
    return defaultValue;
  }
  return value;
};

/**
 * Convertit les données JSON en format compatible avec l'application
 */
export const importCustomData = async (jsonData) => {
  try {
    // Convertir les données au format attendu par l'application
    const locationsData = {};
    
    console.log("Type de données reçu:", typeof jsonData);
    
    // Vérifier si les données sont une chaîne (texte brut)
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
        console.log("Conversion de chaîne JSON en objet réussie");
      } catch (parseError) {
        console.error("Erreur lors de l'analyse de la chaîne JSON:", parseError);
      }
    }
    
    // Détecter le format des données (tableau ou objet)
    let dataArray = [];
    
    if (Array.isArray(jsonData)) {
      console.log("Format détecté: Tableau d'objets avec", jsonData.length, "éléments");
      dataArray = jsonData;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      console.log("Format détecté: Objet JSON avec", Object.keys(jsonData).length, "clés");
      
      // Si c'est un objet avec seulement un élément, vérifier s'il contient un tableau
      const singleValue = Object.values(jsonData)[0];
      if (Object.keys(jsonData).length === 1 && Array.isArray(singleValue)) {
        console.log("Format détecté: Objet contenant un tableau");
        dataArray = singleValue;
      } 
      // Format GeoJSON possible
      else if (jsonData.features && Array.isArray(jsonData.features)) {
        console.log("Format possible: GeoJSON");
        dataArray = jsonData.features.map(feature => feature.properties || feature);
      } 
      // Si c'est un objet avec des champs comme "Region", "Latitude", etc., c'est probablement un seul enregistrement
      else if (
        (jsonData["Region"] || jsonData["Longitude (dégré décimal)"] || jsonData["latitude (dégré décimal)"])
      ) {
        console.log("Format détecté: Objet unique - conversion en tableau d'un élément");
        dataArray = [jsonData];
      }
      // Autres formats d'objets, convertir en tableau
      else {
        console.log("Conversion d'un objet générique en tableau");
        dataArray = Object.values(jsonData);
      }
    } else {
      console.error("Type de données non reconnu:", jsonData);
      throw new Error(`Format de données non reconnu. Attendu: tableau ou objet JSON. Reçu: ${typeof jsonData}`);
    }
    
    // Si le tableau est vide, c'est un problème
    if (dataArray.length === 0) {
      throw new Error("Aucune donnée n'a été trouvée dans le fichier importé.");
    }
    
    console.log(`Nombre d'entrées dans les données: ${dataArray.length}`);
    console.log("Premier élément:", JSON.stringify(dataArray[0]).substring(0, 200) + "...");
    
    // Fonction pour extraire avec sécurité les coordonnées de différents formats
    const extractCoordinates = (item) => {
      // Rechercher les attributs de longitude dans différents formats possibles
      const longitudeKeys = [
        "Longitude (dégré décimal)", "longitude", "lng", "lon", "Longitude", "long",
        "LNG", "LON", "LONGITUDE", "x", "X"
      ];
      
      // Rechercher les attributs de latitude dans différents formats possibles
      const latitudeKeys = [
        "latitude (dégré décimal)", "latitude", "lat", "Latitude", "LAT", 
        "LATITUDE", "y", "Y"
      ];
      
      // Chercher la première clé qui existe dans l'objet
      const findValue = (keys, obj) => {
        for (const key of keys) {
          if (obj[key] !== undefined) {
            // Nettoyer et convertir en nombre
            const value = obj[key];
            if (typeof value === 'string') {
              // Nettoyer les chaînes (remplacer virgules par points, supprimer espaces)
              return parseFloat(value.replace(',', '.').trim());
            } else if (typeof value === 'number') {
              return value;
            }
          }
        }
        return null;
      };
      
      // Extraire les coordonnées
      const longitude = findValue(longitudeKeys, item);
      const latitude = findValue(latitudeKeys, item);
      
      return { longitude, latitude };
    };
    
    // Pour chaque entrée dans les données d'origine
    for (let i = 0; i < dataArray.length; i++) {
      const item = dataArray[i];
      
      // Extraire les coordonnées
      const { longitude, latitude } = extractCoordinates(item);
      
      // Vérifier que les coordonnées sont valides
      if (!isNaN(longitude) && !isNaN(latitude)) {
        // Créer un identifiant unique pour chaque emplacement
        const locationId = `location_${i}`;
        
        // Fonction pour extraire un champ avec différentes possibilités de noms
        const getField = (possibleKeys, defaultValue = "") => {
          for (const key of possibleKeys) {
            if (item[key] !== undefined && item[key] !== null) {
              return item[key];
            }
          }
          return defaultValue;
        };
        
        // Extraire les différents champs avec vérification NaN
        const name = getField(["Localité (village)", "name", "nom", "NAME", "NOM", "village", "Village", "lieu", "Lieu", "Commune", "commune"]);
        const region = getField(["Region", "region", "REGION", "Région", "région"]);
        const district = getField(["District", "district", "DISTRICT"]);
        const commune = getField(["Commune", "commune", "COMMUNE"]);
        
        // Convertir les valeurs numériques et vérifier qu'elles ne sont pas NaN
        let populationRaw = getField(["# population totale", "population", "Population", "POPULATION"], "0");
        let menagesRaw = getField(["# ménage du village", "menages", "ménages", "foyers", "Menages", "MENAGES"], "0");
        let altitudeRaw = getField(["ALTITUDE", "Altitude", "altitude"], "0");
        
        // Assurer des valeurs numériques valides (ni NaN, ni undefined)
        const population = ensureSafeValue(parseInt(populationRaw), 0);
        const menages = ensureSafeValue(parseInt(menagesRaw), 0);
        
        // Traitement spécial pour l'altitude qui a causé l'erreur
        let altitude = 0;
        try {
          if (typeof altitudeRaw === 'string') {
            altitudeRaw = altitudeRaw.replace(',', '.').trim();
          }
          altitude = parseFloat(altitudeRaw);
          if (isNaN(altitude)) altitude = 0;
        } catch (e) {
          console.warn(`Erreur lors de la conversion de l'altitude pour l'emplacement ${i}:`, e);
          altitude = 0;
        }
        
        const milieu = getField(["Milieu (rural/urbain)", "milieu", "type", "Type", "environnement"], "rural");
        
        // Sanitiser les métadonnées originales pour éviter les erreurs Firebase
        const sanitizedOriginal = sanitizeObjectForFirebase({ ...item });
        
        // Construire l'objet d'emplacement au format attendu
        locationsData[locationId] = {
          name: name || "Lieu sans nom",
          description: `${region} - ${district} - ${commune}`.trim().replace(/\s*-\s*$/, ""),
          latitude: latitude,
          longitude: longitude,
          pollutionLevel: Math.floor(Math.random() * 100), // Valeur fictive pour l'exemple
          timestamp: Date.now(),
          dataType: milieu.toLowerCase(),
          // Ajouter d'autres métadonnées originales
          metadata: {
            population: population,
            menages: menages,
            altitude: altitude, // Valeur sécurisée
            region: region,
            district: district,
            commune: commune,
            // Stocker les données originales sanitisées
            original: sanitizedOriginal
          }
        };
      }
    }
    
    // Compter le nombre d'emplacements valides
    const validLocationsCount = Object.keys(locationsData).length;
    console.log(`Nombre d'emplacements valides trouvés: ${validLocationsCount}`);
    
    if (validLocationsCount === 0) {
      throw new Error("Aucun emplacement valide n'a été trouvé dans les données. Vérifiez que vos données contiennent des coordonnées de latitude et longitude.");
    }
    
    // Enregistrer les données dans Firebase
    const locationsRef = ref(database, 'locations');
    await set(locationsRef, locationsData);
    console.log("Données personnalisées importées avec succès");
    
    // Créer également des données d'analyse fictives basées sur les régions
    const regions = [...new Set(Object.values(locationsData).map(loc => loc.metadata?.region))].filter(Boolean);
    const analysisData = {
      pollutionTrends: {},
      riskZones: {
        high: [],
        medium: [],
        low: []
      },
      regionStats: {},
      lastUpdated: Date.now()
    };
    
    // Générer des statistiques fictives par région
    regions.forEach(region => {
      // Trouver tous les emplacements pour cette région
      const regionLocations = Object.values(locationsData).filter(loc => 
        loc.metadata?.region === region
      );
      
      const avgPollution = Math.floor(Math.random() * 100);
      
      // Ajouter aux tendances
      analysisData.pollutionTrends[region] = [
        avgPollution - 10 + Math.floor(Math.random() * 20),
        avgPollution - 5 + Math.floor(Math.random() * 10),
        avgPollution,
        avgPollution + Math.floor(Math.random() * 15),
        avgPollution - Math.floor(Math.random() * 10),
        avgPollution + 5 - Math.floor(Math.random() * 10)
      ];
      
      // Ajouter aux zones à risque
      if (avgPollution > 70) {
        analysisData.riskZones.high.push(region);
      } else if (avgPollution > 40) {
        analysisData.riskZones.medium.push(region);
      } else {
        analysisData.riskZones.low.push(region);
      }
      
      // Statistiques par région
      analysisData.regionStats[region] = {
        avgPollution,
        locationCount: regionLocations.length,
        population: regionLocations.reduce((sum, loc) => sum + (loc.metadata?.population || 0), 0),
        // Autres statistiques fictives
        waterQuality: Math.floor(Math.random() * 100),
        sanitationLevel: Math.floor(Math.random() * 100),
        trendDirection: Math.random() > 0.5 ? "improving" : "deteriorating"
      };
    });
    
    // Enregistrer les données d'analyse
    const analysisRef = ref(database, 'data/analysisResults');
    await set(analysisRef, analysisData);
    console.log("Données d'analyse générées avec succès");
    
    return {
      success: true,
      locationsCount: validLocationsCount,
      regionsCount: regions.length
    };
  } catch (error) {
    console.error("Erreur lors de l'importation des données personnalisées:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
