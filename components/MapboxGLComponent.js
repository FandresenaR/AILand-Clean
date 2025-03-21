import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
// Import toutes les fonctions depuis votre fichier firebase.js
import { database, ref, onValue, signInAnonymous } from '../firebase'

const MapboxGLComponent = ({ mapType = 'streets-v11' }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const mapboxLoaded = useRef(false)
  const markersRef = useRef([]) // Stocker les références aux marqueurs
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authStatus, setAuthStatus] = useState("non-authentifié")
  const [mapStatus, setMapStatus] = useState("chargement")

  // Authentification et récupération des données de Firebase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // S'authentifier anonymement avant d'accéder aux données
        await signInAnonymous();
        setAuthStatus("authentifié");
        
        const locationsRef = ref(database, 'locations');
        
        const unsubscribe = onValue(locationsRef, (snapshot) => {
          try {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const locationArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
              }));
              console.log('Données Firebase chargées:', locationArray);
              setLocations(locationArray);
            } else {
              console.log('Aucune donnée trouvée dans Firebase');
              setLocations([]);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error('Erreur de Firebase:', error);
          setError(error.message);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (authError) {
        console.error("Erreur d'authentification:", authError);
        setError(`Erreur d'authentification: ${authError.message}`);
        setAuthStatus("échec");
        setLoading(false);
        return () => {};
      }
    };

    initializeAuth();
  }, []);

  // Configuration et initialisation de la carte
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.warn("Environnement côté serveur détecté, la carte ne sera pas rendue");
      return;
    }
    
    if (!window.mapboxgl) {
      console.warn("Mapbox GL n'est pas chargé, en attente...");
      return;
    }
    
    // Ne pas réinitialiser si la carte existe déjà
    if (map.current) {
      // Mettre à jour seulement le style de la carte existante
      try {
        if (mapType && map.current) {
          map.current.setStyle(`mapbox://styles/mapbox/${mapType}`);
          console.log("Style de carte mis à jour:", mapType);
        }
      } catch (err) {
        console.error("Erreur lors de la mise à jour du style:", err);
      }
      return;
    }

    // Fonction modifiée pour initialiser la carte avec plus de contrôles d'erreur
    const initializeMap = () => {
      if (!mapboxLoaded.current) {
        console.log("Mapbox n'est pas encore chargé");
        return;
      }

      try {
        console.log("Initialisation de la carte avec le style:", mapType);
        window.mapboxgl.accessToken = 'pk.eyJ1IjoiZmFuZHJlc2VuYS0yNCIsImEiOiJjbTB0b2tyMHIwdWR5MnJzajdyYjdxaHFlIn0.X_jOASRkfd478-irjDhxXg';

        // Sauvegarder la référence actuelle du conteneur
        const container = mapContainer.current;
        if (!container) {
          console.error("Le conteneur de carte est null");
          setError("Erreur: Le conteneur de carte est introuvable");
          return;
        }

        // Forcer un style par défaut connu pour fonctionner
        const mapStyle = mapType || 'streets-v11'; // Assurer un style par défaut
        console.log("Style de carte utilisé:", mapStyle);

        // Création de la carte
        map.current = new window.mapboxgl.Map({
          container: container,
          style: `mapbox://styles/mapbox/${mapStyle}`,
          center: [46.7, -19.0], // Madagascar
          zoom: 5.5,
          failIfMajorPerformanceCaveat: false, // Essayer de charger même avec des performances limitées
          preserveDrawingBuffer: true
        });

        // Ajouter des contrôles
        map.current.addControl(new window.mapboxgl.NavigationControl());
        
        // Événements de carte pour le débogage
        map.current.on('load', () => {
          console.log("Carte chargée avec succès");
          setMapStatus("chargée");

          // Vérifier les couches chargées
          const layers = map.current.getStyle().layers;
          console.log("Couches de carte chargées:", layers ? layers.length : 0);

          // Afficher les marqueurs après le chargement de la carte
          displayMarkers();
        });
        
        map.current.on('error', (e) => {
          console.error("Erreur Mapbox:", e);
          setMapStatus("erreur");
          setError(`Erreur de carte: ${e.error?.message || 'Erreur inconnue'}`);
        });
        
        // Test de visibilité de la carte
        setTimeout(() => {
          if (map.current) {
            const canvas = map.current.getCanvas();
            console.log("Canvas de carte trouvé:", !!canvas);
            if (canvas) {
              console.log("Dimensions du canvas:", canvas.width, "x", canvas.height);
              // Vérifier si la carte a une taille non nulle
              if (canvas.width === 0 || canvas.height === 0) {
                console.error("La carte a une taille nulle");
                setError("La carte a une taille nulle. Vérifiez le CSS.");
              }
            }
          }
        }, 1000);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la carte:", error);
        setMapStatus("erreur");
        setError(`Erreur d'initialisation: ${error.message}`);
      }
    };

    // Initialiser immédiatement si Mapbox est chargé
    if (window.mapboxgl && mapboxLoaded.current) {
      console.log("Mapbox GL est chargé, initialisation de la carte");
      initializeMap();
    } else {
      console.log("En attente du chargement de Mapbox GL...");
    }
  }, [mapType]);

  // Fonction pour afficher les marqueurs
  const displayMarkers = () => {
    if (!map.current) {
      console.error("Impossible d'afficher les marqueurs: la carte n'est pas initialisée");
      return;
    }
    
    if (!map.current._loaded) {
      console.warn("La carte n'est pas encore complètement chargée, les marqueurs seront ajoutés lors du chargement");
      map.current.once('load', displayMarkers);
      return;
    }
    
    if (!locations.length) {
      console.warn("Aucune donnée de localisation à afficher");
      // Ajouter des marqueurs par défaut pour tester
      addDefaultMarkers();
      return;
    }
    
    console.log("Affichage des marqueurs:", locations.length);
    
    // Supprimer les marqueurs existants
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Limites pour centrer la carte
    const bounds = new window.mapboxgl.LngLatBounds();
    let visibleMarkers = 0;
    
    // Ajouter les nouveaux marqueurs
    locations.forEach(location => {
      if (isNaN(location.longitude) || isNaN(location.latitude)) {
        console.warn("Coordonnées invalides pour:", location.name || "Emplacement inconnu");
        return;
      }
      
      try {
        // Créer l'élément DOM pour le marqueur
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        
        // Styliser le marqueur
        const color = getPollutionColor(location.pollutionLevel);
        const size = Math.max(30, Math.min(60, 30 + (location.pollutionLevel / 5))); // Marqueurs plus gros
        
        markerEl.style.width = `${size}px`;
        markerEl.style.height = `${size}px`;
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = color;
        markerEl.style.border = '3px solid white'; // Bordure plus visible
        markerEl.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // Ombre plus visible
        markerEl.style.cursor = 'pointer';
        markerEl.style.zIndex = '10'; // S'assurer que les marqueurs sont visibles
        
        // Contenu de la popup
        const popupContent = `
          <div style="max-width: 280px; color: black; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: black;">${location.name || 'Emplacement'}</h3>
            <p style="margin: 0 0 8px; color: black;">${location.description || ''}</p>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 100%; background-color: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="width: ${location.pollutionLevel}%; background-color: ${color}; height: 100%;"></div>
              </div>
              <span style="margin-left: 8px; font-weight: bold; color: black;">${location.pollutionLevel}%</span>
            </div>
            <p style="margin: 0; font-size: 12px; color: #333;">Type: ${location.dataType || 'Non spécifié'}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #333;">Coordonnées: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
          </div>
        `;
        
        // Créer le marqueur avec l'élément personnalisé
        const marker = new window.mapboxgl.Marker(markerEl)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(
            new window.mapboxgl.Popup({ 
              offset: 25,
              className: 'black-text-popup' // Classe CSS personnalisée
            }).setHTML(popupContent)
          );
          
        // Ajouter à la carte
        marker.addTo(map.current);
        markersRef.current.push(marker);
        visibleMarkers++;
        
        // Étendre les limites pour inclure ce marqueur
        bounds.extend([location.longitude, location.latitude]);
        
        // Mettre en évidence le marqueur pour Anosibe Ifody Tanana
        if (location.id === 'location_0' || location.name === 'Anosibe Ifody Tanana') {
          markerEl.style.boxShadow = '0 0 0 5px yellow, 0 0 10px rgba(0,0,0,0.5)';
          markerEl.style.zIndex = '20';
          
          // Ouvrir automatiquement sa popup
          setTimeout(() => marker.togglePopup(), 1500);
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du marqueur:", error);
      }
    });
    
    console.log(`${visibleMarkers} marqueurs affichés sur ${locations.length}`);
    
    // Si aucun marqueur n'a été ajouté, utiliser les marqueurs par défaut
    if (visibleMarkers === 0) {
      addDefaultMarkers();
    } else if (visibleMarkers > 0) {
      // Ajuster la vue pour voir tous les marqueurs
      try {
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 12
        });
      } catch (error) {
        console.error("Erreur lors de l'ajustement des limites de la carte:", error);
      }
    }
  };

  // Fonction pour générer une couleur en fonction du niveau de pollution
  const getPollutionColor = (level) => {
    if (level >= 80) return '#d73027'; // Rouge - Très élevé
    if (level >= 60) return '#fc8d59'; // Orange - Élevé
    if (level >= 40) return '#fee08b'; // Jaune - Moyen
    if (level >= 20) return '#d9ef8b'; // Vert-jaune - Faible
    return '#1a9850'; // Vert - Très faible
  };

  // Fonction pour ajouter des marqueurs par défaut (pour tester si la carte fonctionne)
  const addDefaultMarkers = () => {
    if (!map.current || !window.mapboxgl) return;
    
    console.log("Ajout de marqueurs par défaut");
    
    const defaultMarkers = [
      { lng: 47.5079, lat: -18.8792, name: "Antananarivo" },
      { lng: 49.2920, lat: -16.2325, name: "Toamasina" },
      { lng: 43.2203, lat: -23.3516, name: "Toliara" }
    ];
      
    defaultMarkers.forEach(marker => {
      try {
        const newMarker = new window.mapboxgl.Marker({ color: "#FF0000" }) // Rouge pour les distinguer
          .setLngLat([marker.lng, marker.lat])
          .setPopup(
            new window.mapboxgl.Popup({ className: 'black-text-popup' })
              .setHTML(`<div style="color: black;"><h3 style="color: black; margin: 0 0 8px;">${marker.name}</h3><p style="color: black;">Marqueur de test</p></div>`)
          )
          .addTo(map.current);
        markersRef.current.push(newMarker);
        console.log(`Marqueur par défaut ajouté: ${marker.name}`);
      } catch (error) {
        console.error(`Erreur lors de l'ajout du marqueur par défaut ${marker.name}:`, error);
      }
    });
    
    // Centrer la carte sur Madagascar
    map.current.flyTo({
      center: [46.7, -19.0],
      zoom: 5.5
    });
  };

  return (
    <div className="relative">
      {/* Styles CSS global pour les popups Mapbox avec texte noir */}
      <style jsx global>{`
        .mapboxgl-popup-content {
          color: black !important;
          font-family: Arial, sans-serif;
        }
        .black-text-popup .mapboxgl-popup-content h3,
        .black-text-popup .mapboxgl-popup-content p,
        .black-text-popup .mapboxgl-popup-content div,
        .black-text-popup .mapboxgl-popup-content span {
          color: black !important;
        }
        /* Assurer que les attributions et contrôles sont également lisibles */
        .mapboxgl-ctrl-attrib-inner, 
        .mapboxgl-ctrl-attrib-inner a,
        .mapboxgl-ctrl button span {
          color: black !important;
        }
      `}</style>
      
      {/* Carte avec une taille explicite */}
      <div 
        ref={mapContainer} 
        className="map-container" 
        style={{ 
          width: '100%', 
          height: '600px', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
      ></div>
      
      {/* Indicateur d'état de la carte */}
      {mapStatus !== "chargée" && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center">
          {mapStatus === "chargement" && (
            <>
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
              <p>Chargement de la carte...</p>
            </>
          )}
          {mapStatus === "erreur" && (
            <div className="text-red-600 text-center p-4">
              <p className="text-xl font-bold mb-2">Erreur de chargement</p>
              <p>{error || "Impossible de charger la carte."}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Chargement des données Firebase */}
      {loading && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded shadow">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent inline-block mr-2"></div>
          Chargement des données...
        </div>
      )}
      
      {/* Affichage des erreurs */}
      {error && (
        <div className="absolute bottom-2 left-2 bg-red-100 text-red-800 p-2 rounded shadow max-w-xs">
          <p className="font-bold">Erreur:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Script Mapbox avec gestionnaire d'erreur */}
      <Script 
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        onLoad={() => {
          console.log("Mapbox GL JS chargé");
          mapboxLoaded.current = true;
        }}
        onError={() => {
          console.error("Erreur lors du chargement de Mapbox GL JS");
          setError("Impossible de charger la bibliothèque Mapbox");
          setMapStatus("erreur");
        }}
      />
      
      {/* Inclure le CSS de Mapbox directement */}
      <link 
        href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" 
        rel="stylesheet" 
      />
      
      {/* Légende */}
      <div className="mt-4 p-3 bg-white rounded shadow-sm text-black">
        <h4 className="font-bold mb-2 text-black">Niveau de pollution</h4>
        <div className="text-sm text-black">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: '#d73027'}}></div>
            <span className="text-black">Très élevé (80-100%)</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: '#fc8d59'}}></div>
            <span className="text-black">Élevé (60-79%)</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: '#fee08b'}}></div>
            <span className="text-black">Moyen (40-59%)</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: '#d9ef8b'}}></div>
            <span className="text-black">Faible (20-39%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: '#1a9850'}}></div>
            <span className="text-black">Très faible (0-19%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapboxGLComponent