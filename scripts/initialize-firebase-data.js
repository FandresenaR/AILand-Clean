import { database, ref, set } from '../firebase';

/**
 * Initialise les données de localisation pour Madagascar
 */
export const initializeLocationsData = async () => {
  try {
    // Données d'exemple pour Madagascar
    const locationsData = {
      location1: {
        name: "Antananarivo",
        description: "Capitale de Madagascar",
        latitude: -18.8792,
        longitude: 47.5079,
        pollutionLevel: 65,
        timestamp: Date.now(),
        dataType: "urban"
      },
      location2: {
        name: "Toamasina",
        description: "Principal port de Madagascar",
        latitude: -18.1443,
        longitude: 49.3957,
        pollutionLevel: 48,
        timestamp: Date.now(),
        dataType: "coastal"
      },
      location3: {
        name: "Nosy Be",
        description: "Île touristique",
        latitude: -13.3273,
        longitude: 48.2584,
        pollutionLevel: 25,
        timestamp: Date.now(),
        dataType: "island"
      },
      location4: {
        name: "Toliara",
        description: "Ville côtière du sud-ouest",
        latitude: -23.3516,
        longitude: 43.6675,
        pollutionLevel: 55,
        timestamp: Date.now(),
        dataType: "coastal"
      },
      location5: {
        name: "Andasibe",
        description: "Parc national",
        latitude: -18.9283,
        longitude: 48.4186,
        pollutionLevel: 12,
        timestamp: Date.now(),
        dataType: "forest"
      }
    };

    // Écrire les données dans Firebase
    const locationsRef = ref(database, 'locations');
    await set(locationsRef, locationsData);
    console.log("Données de localisation initialisées avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données:", error);
    return false;
  }
};

/**
 * Initialise les données d'analyse environnementale
 */
export const initializeAnalysisData = async () => {
  try {
    const analysisData = {
      pollutionTrends: {
        urban: [65, 68, 70, 72, 65, 63, 67],
        coastal: [48, 52, 50, 45, 47, 51, 49],
        forest: [12, 14, 11, 13, 15, 12, 10],
        island: [25, 27, 24, 26, 28, 24, 22]
      },
      riskZones: {
        high: ["Antananarivo", "Toliara"],
        medium: ["Toamasina"],
        low: ["Nosy Be", "Andasibe"]
      },
      lastUpdated: Date.now()
    };

    const analysisRef = ref(database, 'data/analysisResults');
    await set(analysisRef, analysisData);
    console.log("Données d'analyse initialisées avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données d'analyse:", error);
    return false;
  }
};
