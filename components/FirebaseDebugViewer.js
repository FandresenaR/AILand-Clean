import { useState, useEffect } from 'react';
import { database, ref, onValue, signInAnonymous, getDataWithoutAuth } from '../firebase';

const FirebaseDebugViewer = ({ path = 'locations', maxDepth = 3 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [authStatus, setAuthStatus] = useState('non-authentifié');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setAuthStatus('en cours...');
        
        try {
          // Essayer l'authentification anonyme
          await signInAnonymous();
          setAuthStatus('authentifié');
          
          // Continuer avec la récupération de données authentifiée
          const dataRef = ref(database, path);
          
          const unsubscribe = onValue(dataRef, (snapshot) => {
            if (snapshot.exists()) {
              const fetchedData = snapshot.val();
              console.log(`Données Firebase récupérées (${path}):`, fetchedData);
              setData(fetchedData);
            } else {
              console.log(`Aucune donnée trouvée dans le chemin: ${path}`);
              setData(null);
            }
            setLoading(false);
          }, (fetchError) => {
            console.error('Erreur lors de la récupération des données:', fetchError);
            setError(fetchError.message);
            setLoading(false);
          });
          
          return () => unsubscribe();
        } catch (authError) {
          console.error('Erreur d\'authentification:', authError);
          
          // Si l'authentification échoue, essayer de récupérer les données sans auth
          setAuthStatus('échec - accès public');
          
          try {
            // Récupérer les données sans authentification (utilise les règles publiques)
            const publicData = await getDataWithoutAuth(path);
            setData(publicData);
            setLoading(false);
            console.log(`Données Firebase récupérées sans auth (${path}):`, publicData);
          } catch (publicError) {
            console.error("Échec de la récupération publique :", publicError);
            setError(`Erreur d'accès: ${publicError.message}`);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Erreur globale:', error);
        setError(`Erreur: ${error.message}`);
        setAuthStatus('échec');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [path]);

  const toggleExpand = (key) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderValue = (value, key, depth = 0) => {
    if (depth >= maxDepth) {
      return <span className="text-blue-600">Object trop profond...</span>;
    }

    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;
    
    if (typeof value === 'object') {
      const isArray = Array.isArray(value);
      const expandKey = `${depth}-${key}`;
      const isExpanded = expanded[expandKey];
      
      return (
        <div className="pl-4">
          <button 
            onClick={() => toggleExpand(expandKey)}
            className="text-blue-500 hover:text-blue-700 font-bold"
          >
            {isExpanded ? '▼ ' : '► '}
            {isArray ? 'Array' : 'Object'} ({Object.keys(value).length})
          </button>
          
          {isExpanded && (
            <div className="pl-4 border-l-2 border-gray-300 ml-2">
              {Object.entries(value).map(([childKey, childValue]) => (
                <div key={childKey} className="my-1">
                  <span className="font-semibold">{childKey}: </span>
                  {renderValue(childValue, `${expandKey}-${childKey}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Valeurs primitives
    if (typeof value === 'string') return <span className="text-green-600">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-purple-600">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-amber-600">{value ? 'true' : 'false'}</span>;
    
    return <span>{String(value)}</span>;
  };

  /**
   * Détermine si une structure de données est complexe et imbriquée
   * et donc non adaptée pour un affichage sous forme de tableau
   */
  const isComplexNestedStructure = (data) => {
    if (!data || typeof data !== 'object') return false;
    
    // Si c'est un tableau, c'est considéré comme complexe
    if (Array.isArray(data)) return true;
    
    // Vérifier si c'est une structure d'analyse
    const keys = Object.keys(data);
    const analysisKeys = ['pollutionTrends', 'riskZones', 'regionStats', 'lastUpdated'];
    const hasAnalysisFormat = analysisKeys.some(key => keys.includes(key));
    
    if (hasAnalysisFormat) return true;
    
    // Vérifier si les valeurs contiennent des objets ou des tableaux imbriqués
    for (const key in data) {
      const value = data[key];
      if (value && typeof value === 'object') {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Rendu spécial pour les données d'analyse environnementale
   */
  const renderAnalysisData = (data) => {
    if (!data || typeof data !== 'object') return null;
    
    // Vérification plus stricte de la structure des données
    const hasPollutionTrends = data.pollutionTrends && typeof data.pollutionTrends === 'object';
    const hasRiskZones = data.riskZones && typeof data.riskZones === 'object';
    const hasRegionStats = data.regionStats && typeof data.regionStats === 'object';
    
    // Si une partie essentielle est manquante, afficher un message
    if (!hasPollutionTrends || !hasRiskZones || !hasRegionStats) {
      return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700">
            <strong>Note:</strong> Les données d&apos;analyse sont incomplètes ou dans un format inattendu.
            Voici les sections disponibles:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Tendances de pollution: {hasPollutionTrends ? "Présent" : "Manquant"}</li>
            <li>Zones à risque: {hasRiskZones ? "Présent" : "Manquant"}</li>
            <li>Statistiques par région: {hasRegionStats ? "Présent" : "Manquant"}</li>
          </ul>
        </div>
      );
    }
    
    // Extraire et sécuriser les données
    const pollutionTrends = data.pollutionTrends || {};
    const riskZones = {
      high: Array.isArray(data.riskZones?.high) ? data.riskZones.high : [],
      medium: Array.isArray(data.riskZones?.medium) ? data.riskZones.medium : [],
      low: Array.isArray(data.riskZones?.low) ? data.riskZones.low : []
    };
    const regionStats = data.regionStats || {};
    const lastUpdated = data.lastUpdated || Date.now();

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-3">Résultats d&apos;analyse environnementale</h3>
        
        {/* Tendances de pollution */}
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2">Tendances de pollution par région</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(pollutionTrends).length > 0 ? (
              Object.entries(pollutionTrends).map(([region, values]) => (
                <div key={region} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <div className="font-medium mb-2">{region}</div>
                  <div className="h-20 flex items-end space-x-1">
                    {Array.isArray(values) ? values.map((value, i) => (
                      <div 
                        key={i} 
                        className="flex-grow bg-blue-500" 
                        style={{ 
                          height: `${value}%`,
                          backgroundColor: value > 70 ? '#d73027' : value > 50 ? '#fc8d59' : value > 30 ? '#fee08b' : '#1a9850'
                        }}
                        title={`Valeur: ${value}`}
                      ></div>
                    )) : (
                      <div className="w-full text-center text-gray-500">Données non disponibles</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 p-4 bg-gray-50 rounded">
                Aucune tendance de pollution disponible
              </div>
            )}
          </div>
        </div>
        
        {/* Zones à risque */}
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2">Zones à risque</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <div className="font-medium text-red-700 mb-1">Risque élevé</div>
              <ul className="list-disc pl-5">
                {riskZones.high.map((zone, i) => (
                  <li key={i}>{zone}</li>
                ))}
              </ul>
              {riskZones.high.length === 0 && <span className="text-gray-500 italic">Aucune zone</span>}
            </div>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <div className="font-medium text-yellow-700 mb-1">Risque moyen</div>
              <ul className="list-disc pl-5">
                {riskZones.medium.map((zone, i) => (
                  <li key={i}>{zone}</li>
                ))}
              </ul>
              {riskZones.medium.length === 0 && <span className="text-gray-500 italic">Aucune zone</span>}
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="font-medium text-green-700 mb-1">Risque faible</div>
              <ul className="list-disc pl-5">
                {riskZones.low.map((zone, i) => (
                  <li key={i}>{zone}</li>
                ))}
              </ul>
              {riskZones.low.length === 0 && <span className="text-gray-500 italic">Aucune zone</span>}
            </div>
          </div>
        </div>
        
        {/* Statistiques par région */}
        <div>
          <h4 className="text-md font-semibold mb-2">Statistiques par région</h4>
          {Object.keys(regionStats).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Région</th>
                    <th className="py-2 px-4 border-b text-left">Pollution moyenne</th>
                    <th className="py-2 px-4 border-b text-left">Nombre de sites</th>
                    <th className="py-2 px-4 border-b text-left">Population</th>
                    <th className="py-2 px-4 border-b text-left">Qualité de l&apos;eau</th>
                    <th className="py-2 px-4 border-b text-left">Niveau d&apos;assainissement</th>
                    <th className="py-2 px-4 border-b text-left">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(regionStats).map(([region, stats]) => {
                    if (!stats || typeof stats !== 'object') return null;
                    
                    // Extraire les propriétés avec valeurs par défaut
                    const avgPollution = stats.avgPollution || 0;
                    const locationCount = stats.locationCount || 0;
                    const population = stats.population || 0;
                    const waterQuality = stats.waterQuality || 0;
                    const sanitationLevel = stats.sanitationLevel || 0;
                    const trendDirection = stats.trendDirection || 'unknown';
                    
                    return (
                      <tr key={region} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b font-medium">{region}</td>
                        <td className="py-2 px-4 border-b">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 h-4 rounded mr-2">
                              <div 
                                className="h-full rounded" 
                                style={{ 
                                  width: `${avgPollution}%`,
                                  backgroundColor: avgPollution > 70 ? '#d73027' : avgPollution > 50 ? '#fc8d59' : avgPollution > 30 ? '#fee08b' : '#1a9850'
                                }}
                              ></div>
                            </div>
                            <span>{avgPollution}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-4 border-b">{locationCount}</td>
                        <td className="py-2 px-4 border-b">{typeof population === 'number' ? population.toLocaleString() : population}</td>
                        <td className="py-2 px-4 border-b">{waterQuality}%</td>
                        <td className="py-2 px-4 border-b">{sanitationLevel}%</td>
                        <td className="py-2 px-4 border-b">
                          {trendDirection !== 'unknown' ? (
                            <span className={`px-2 py-1 rounded text-xs ${
                              trendDirection === 'improving' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {trendDirection === 'improving' ? 'En amélioration' : 'En détérioration'}
                            </span>
                          ) : (
                            <span className="text-gray-500">Inconnu</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4 bg-gray-50 rounded">
              Aucune statistique par région disponible
            </div>
          )}
        </div>
        
        {/* Dernière mise à jour */}
        <div className="mt-4 text-sm text-gray-500">
          Dernière mise à jour: {new Date(lastUpdated).toLocaleString()}
        </div>
      </div>
    );
  };

  // Nouvelle fonction améliorée pour afficher les données sous forme de tableau
  const renderDataTable = (data) => {
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    // Si c'est une structure de données complexe comme des résultats d'analyse, utiliser un rendu spécial
    if (isComplexNestedStructure(data)) {
      // Si c'est un format d'analyse spécifique
      if (data.pollutionTrends && data.riskZones && data.regionStats) {
        return renderAnalysisData(data);
      }
      
      // Pour les autres structures complexes, préférer le rendu JSON
      return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700">
            <strong>Note:</strong> Ces données ont une structure complexe qui n&apos;est pas adaptée à un affichage en tableau.
            Utilisez l&apos;affichage JSON pour explorer les détails.
          </p>
        </div>
      );
    }

    // Pour les objets simples (comme la liste des emplacements), utiliser un tableau
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    
    // Analyser le premier élément pour déterminer les colonnes
    const firstItem = entries[0][1];
    if (!firstItem || typeof firstItem !== 'object' || Array.isArray(firstItem)) {
      return null;
    }
    
    // Pour les tableaux d'objets simples, comme les emplacements
    const columns = ['id', ...Object.keys(firstItem).filter(key => 
      typeof firstItem[key] !== 'object' || 
      key === 'pollutionLevel' || 
      key === 'dataType'
    )];

    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(column => (
                <th key={column} className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([id, item]) => (
              <tr key={id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{id}</td>
                {columns.slice(1).map(column => (
                  <td key={`${id}-${column}`} className="py-2 px-4 border-b">
                    {column === 'pollutionLevel' ? (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 h-3 rounded mr-2">
                          <div 
                            className="h-full rounded" 
                            style={{ 
                              width: `${item[column]}%`,
                              backgroundColor: item[column] > 70 ? '#d73027' : item[column] > 50 ? '#fc8d59' : item[column] > 30 ? '#fee08b' : '#1a9850'
                            }}
                          ></div>
                        </div>
                        <span>{item[column]}%</span>
                      </div>
                    ) : (
                      renderCellValue(item[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Fonction d'aide pour formater les valeurs des cellules
  const renderCellValue = (value) => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400">-</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Vrai</span> : 
        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Faux</span>;
    }
    if (typeof value === 'number') {
      return <span className="font-mono">{value}</span>;
    }
    if (typeof value === 'object') {
      return <span className="text-blue-500">{Array.isArray(value) ? '[...]' : '{...}'}</span>;
    }
    return String(value);
  };

  return (
    <div className="bg-white shadow-md rounded p-4 my-4 max-w-full overflow-auto">
      <h2 className="text-xl font-bold mb-2">Débogueur Firebase</h2>
      <div className="mb-2 flex justify-between">
        <div>
          <span className="font-bold">Chemin: </span>
          <code className="bg-gray-100 px-2 py-1 rounded">{path}</code>
        </div>
        <div>
          <span className="font-bold mr-2">Auth:</span>
          <span className={`px-2 py-1 rounded ${
            authStatus === 'authentifié' ? 'bg-green-100 text-green-800' : 
            authStatus === 'échec - accès public' ? 'bg-yellow-100 text-yellow-800' :
            authStatus === 'échec' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {authStatus}
          </span>
        </div>
      </div>
      
      {loading && (
        <div className="text-center p-4">
          <div className="animate-spin h-5 w-5 mr-3 rounded-full border-t-2 border-b-2 border-blue-500 inline-block"></div>
          Chargement des données...
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div>
          {data === null ? (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
              Aucune donnée trouvée au chemin spécifié.
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-semibold">Données</h3>
                <div className="flex space-x-2">
                  <button 
                    className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => toggleExpand('root')}
                  >
                    {expanded['root'] ? 'Masquer' : 'Afficher'} JSON
                  </button>
                </div>
              </div>
              
              {expanded['root'] && (
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <div className="font-mono text-sm">
                    {renderValue(data, 'root')}
                  </div>
                </div>
              )}
              
              {/* Affichage adapté au type de données */}
              {renderDataTable(data)}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Pour voir les détails complets, ouvrez la console du navigateur (F12).</p>
      </div>
    </div>
  );
};

export default FirebaseDebugViewer;
