import { useState, useEffect } from 'react';
import { database, ref, onValue, signInAnonymous } from '../firebase';

const EnvironmentAnalysis = ({ darkMode = false }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Authentification
        await signInAnonymous();
        
        // Récupérer les données d'analyse
        const analysisRef = ref(database, 'data/analysisResults');
        const locationsRef = ref(database, 'locations');
        
        // Récupérer les données d'analyse
        const analysisUnsubscribe = onValue(analysisRef, (snapshot) => {
          if (snapshot.exists()) {
            setAnalysisData(snapshot.val());
          } else {
            setAnalysisData(null);
          }
        }, (error) => {
          console.error('Erreur lors de la récupération des données d\'analyse:', error);
        });
        
        // Récupérer les données de localisation
        const locationsUnsubscribe = onValue(locationsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setLocationData(data);
            setLoading(false);
          } else {
            setLocationData(null);
            setLoading(false);
          }
        }, (error) => {
          console.error('Erreur lors de la récupération des locations:', error);
          setError(error.message);
          setLoading(false);
        });
        
        return () => {
          analysisUnsubscribe();
          locationsUnsubscribe();
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fonction pour générer une couleur en fonction du niveau de pollution
  const getPollutionColor = (level) => {
    if (level >= 80) return '#d73027'; // Rouge - Très élevé
    if (level >= 60) return '#fc8d59'; // Orange - Élevé
    if (level >= 40) return '#fee08b'; // Jaune - Moyen
    if (level >= 20) return '#d9ef8b'; // Vert-jaune - Faible
    return '#1a9850'; // Vert - Très faible
  };

  // Calculer des statistiques supplémentaires
  const calculateAdditionalStats = () => {
    if (!locationData || !analysisData) return null;
    
    // Convertir les objets en tableaux
    const locations = Object.values(locationData);
    
    // Moyenne de pollution globale
    const avgPollution = locations.reduce((sum, loc) => sum + (loc.pollutionLevel || 0), 0) / locations.length;
    
    // Les 3 emplacements les plus pollués
    const mostPolluted = [...locations].sort((a, b) => b.pollutionLevel - a.pollutionLevel).slice(0, 3);
    
    // Répartition par type d'environnement
    const typeDistribution = locations.reduce((acc, loc) => {
      const type = loc.dataType || 'non-spécifié';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Distribution des niveaux de pollution
    const pollutionDistribution = {
      veryHigh: locations.filter(l => l.pollutionLevel >= 80).length,
      high: locations.filter(l => l.pollutionLevel >= 60 && l.pollutionLevel < 80).length,
      medium: locations.filter(l => l.pollutionLevel >= 40 && l.pollutionLevel < 60).length,
      low: locations.filter(l => l.pollutionLevel >= 20 && l.pollutionLevel < 40).length,
      veryLow: locations.filter(l => l.pollutionLevel < 20).length
    };
    
    // Tendance moyenne (en amélioration ou en détérioration)
    const regions = Object.keys(analysisData.regionStats || {});
    const improvingRegions = regions.filter(r => 
      analysisData.regionStats[r].trendDirection === 'improving'
    ).length;
    const deterioratingRegions = regions.length - improvingRegions;
    
    return {
      avgPollution,
      mostPolluted,
      typeDistribution,
      pollutionDistribution,
      regionStats: {
        total: regions.length,
        improving: improvingRegions,
        deteriorating: deterioratingRegions
      }
    };
  };

  const additionalStats = calculateAdditionalStats();

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md rounded p-4 my-4 animate-pulse`}>
        <div className="h-6 bg-gray-600 rounded mb-4 w-1/2"></div>
        <div className="h-40 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900' : 'bg-red-50'} border-l-4 border-red-500 ${darkMode ? 'text-red-200' : 'text-red-700'} p-4 my-4`}>
        <p className="font-bold">Erreur lors du chargement des analyses</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!analysisData || !locationData) {
    return (
      <div className={`${darkMode ? 'bg-yellow-900' : 'bg-yellow-50'} border-l-4 border-yellow-500 ${darkMode ? 'text-yellow-200' : 'text-yellow-700'} p-4 my-4`}>
        <p className="font-bold">Données d'analyse non disponibles</p>
        <p>Veuillez initialiser les données d'analyse pour voir ce tableau de bord.</p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md rounded p-4 my-4`}>
      <h2 className="text-2xl font-bold mb-4">Tableau de bord environnemental</h2>
      
      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-700'} p-4 rounded shadow-sm`}>
          <h3 className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase font-semibold`}>Zones surveillées</h3>
          <p className="text-3xl font-bold">{Object.keys(locationData).length}</p>
          <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-gray-500'}`}>{additionalStats.regionStats.total} régions</p>
        </div>
        
        <div className={`${darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-700'} p-4 rounded shadow-sm`}>
          <h3 className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'} uppercase font-semibold`}>Pollution moyenne</h3>
          <p className="text-3xl font-bold">{additionalStats.avgPollution.toFixed(1)}%</p>
          <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mt-2`}>
            <div className="h-2.5 rounded-full" style={{
              width: `${additionalStats.avgPollution}%`,
              backgroundColor: getPollutionColor(additionalStats.avgPollution)
            }}></div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-50 text-yellow-700'} p-4 rounded shadow-sm`}>
          <h3 className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'} uppercase font-semibold`}>Tendance des régions</h3>
          <p className="text-3xl font-bold">
            {additionalStats.regionStats.improving} <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>↑</span> 
            {additionalStats.regionStats.deteriorating} <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>↓</span>
          </p>
          <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-gray-500'}`}>
            {additionalStats.regionStats.improving > additionalStats.regionStats.deteriorating ? 
              "Tendance générale positive" : "Tendance générale préoccupante"}
          </p>
        </div>
        
        <div className={`${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-700'} p-4 rounded shadow-sm`}>
          <h3 className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'} uppercase font-semibold`}>Zones critiques</h3>
          <p className="text-3xl font-bold">{additionalStats.pollutionDistribution.veryHigh}</p>
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-gray-500'}`}>
            {((additionalStats.pollutionDistribution.veryHigh / Object.keys(locationData).length) * 100).toFixed(1)}% du total
          </p>
        </div>
      </div>
      
      {/* Distribution des niveaux de pollution */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Distribution des niveaux de pollution</h3>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded`}>
          <div className="flex h-8 mb-2">
            {Object.entries(additionalStats.pollutionDistribution).map(([level, count], index) => {
              const colors = {
                veryHigh: '#d73027',
                high: '#fc8d59',
                medium: '#fee08b',
                low: '#d9ef8b',
                veryLow: '#1a9850'
              };
              
              const labels = {
                veryHigh: 'Très élevé',
                high: 'Élevé',
                medium: 'Moyen',
                low: 'Faible',
                veryLow: 'Très faible'
              };
              
              const percentage = (count / Object.keys(locationData).length) * 100;
              
              return (
                <div key={level} 
                     style={{ 
                       width: `${percentage}%`, 
                       backgroundColor: colors[level] 
                     }} 
                     className="flex items-center justify-center text-xs font-semibold text-white"
                     title={`${labels[level]}: ${count} sites (${percentage.toFixed(1)}%)`}
                >
                  {percentage > 8 ? `${percentage.toFixed(0)}%` : ''}
                </div>
              );
            })}
          </div>
          <div className="flex text-xs text-gray-600 justify-between">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 mr-1 rounded-sm"></div>
            <span>Très élevé: {additionalStats.pollutionDistribution.veryHigh}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 mr-1 rounded-sm"></div>
            <span>Élevé: {additionalStats.pollutionDistribution.high}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-300 mr-1 rounded-sm"></div>
            <span>Moyen: {additionalStats.pollutionDistribution.medium}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-300 mr-1 rounded-sm"></div>
            <span>Faible: {additionalStats.pollutionDistribution.low}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 mr-1 rounded-sm"></div>
            <span>Très faible: {additionalStats.pollutionDistribution.veryLow}</span>
          </div>
        </div>
      </div>
      
      {/* Top emplacements les plus pollués */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Zones critiques à surveiller</h3>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Emplacement</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Région</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Type</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Niveau de pollution</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
              {additionalStats.mostPolluted.map((location, index) => (
                <tr key={index} className={index % 2 === 0 
                  ? (darkMode ? 'bg-gray-800' : 'bg-white') 
                  : (darkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{location.name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{location.metadata?.region || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      darkMode 
                        ? (location.dataType === 'urban' ? 'bg-gray-600 text-gray-200' : 
                           location.dataType === 'coastal' ? 'bg-blue-800 text-blue-200' : 
                           location.dataType === 'forest' ? 'bg-green-800 text-green-200' : 
                           location.dataType === 'island' ? 'bg-red-800 text-red-200' : 'bg-gray-600 text-gray-200')
                        : (location.dataType === 'urban' ? 'bg-gray-100 text-gray-800' : 
                           location.dataType === 'coastal' ? 'bg-blue-100 text-blue-800' : 
                           location.dataType === 'forest' ? 'bg-green-100 text-green-800' : 
                           location.dataType === 'island' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')
                    }`}>
                      {location.dataType || 'Non spécifié'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2.5 w-24 mr-2`}>
                        <div className="h-2.5 rounded-full" style={{
                          width: `${location.pollutionLevel}%`,
                          backgroundColor: getPollutionColor(location.pollutionLevel)
                        }}></div>
                      </div>
                      <span className="font-medium">{location.pollutionLevel}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Insights et recommandations */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Analyse et recommandations</h3>
        <div className={`${darkMode ? 'bg-indigo-900 border-indigo-700 text-indigo-100' : 'bg-indigo-50 border-indigo-500 text-indigo-900'} border-l-4 p-4 rounded`}>
          <h4 className={`font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'} mb-2`}>Insights clés</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>{additionalStats.pollutionDistribution.veryHigh + additionalStats.pollutionDistribution.high} zones</strong> présentent 
              des niveaux de pollution préoccupants (élevés à très élevés) nécessitant une intervention prioritaire.
            </li>
            <li>
              Les zones de type <strong>{Object.entries(additionalStats.typeDistribution).sort((a, b) => b[1] - a[1])[0][0]}</strong> sont les 
              plus nombreuses dans l'échantillon ({Object.entries(additionalStats.typeDistribution).sort((a, b) => b[1] - a[1])[0][1]} sites).
            </li>
            <li>
              <strong>{((additionalStats.regionStats.improving / additionalStats.regionStats.total) * 100).toFixed(0)}%</strong> des régions 
              montrent une tendance à l'amélioration, suggérant que les initiatives environnementales pourraient être efficaces dans ces zones.
            </li>
          </ul>
        </div>
      </div>
      
      {/* Rapport d'intervalle de temps */}
      <div className={`text-right text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-4`}>
        <p>Dernière mise à jour: {new Date(analysisData.lastUpdated).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default EnvironmentAnalysis;
