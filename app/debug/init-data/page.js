'use client';

import { useState } from 'react';
import { initializeLocationsData, initializeAnalysisData } from '../../../scripts/initialize-firebase-data';
import Link from 'next/link';

export default function InitDataPage() {
  const [status, setStatus] = useState({ loading: false, success: false, error: null });
  const [results, setResults] = useState({ locations: null, analysis: null });

  const handleInit = async () => {
    try {
      setStatus({ loading: true, success: false, error: null });
      
      // Initialiser les données de localisation
      const locationsResult = await initializeLocationsData();
      setResults(prev => ({ ...prev, locations: locationsResult }));
      
      // Initialiser les données d'analyse
      const analysisResult = await initializeAnalysisData();
      setResults(prev => ({ ...prev, analysis: analysisResult }));
      
      setStatus({ 
        loading: false, 
        success: locationsResult && analysisResult,
        error: null
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      setStatus({ loading: false, success: false, error: error.message });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Initialisation des données Firebase</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Information</p>
        <p>Cette page vous permet d&apos;initialiser des données d&apos;exemple dans votre base de données Firebase.</p>
        <p>Cela créera des emplacements et des résultats d&apos;analyse fictifs que vous pourrez visualiser.</p>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={handleInit}
          disabled={status.loading}
          className={`px-4 py-2 rounded font-bold ${
            status.loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {status.loading ? 'Initialisation en cours...' : 'Initialiser les données'}
        </button>
      </div>
      
      {status.error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Erreur</p>
          <p>{status.error}</p>
        </div>
      )}
      
      {status.success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p className="font-bold">Succès!</p>
          <p>Les données ont été initialisées avec succès dans votre base de données Firebase.</p>
          <div className="mt-4">
            <Link href="/debug/firebase" className="text-blue-600 hover:text-blue-800 underline">
              Voir les données →
            </Link>
          </div>
        </div>
      )}
      
      {results.locations !== null && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Données de localisation:</h2>
          <div className={`mt-2 p-2 rounded ${results.locations ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {results.locations ? 'Initialisées avec succès' : 'Échec de l&apos;initialisation'}
          </div>
        </div>
      )}
      
      {results.analysis !== null && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Données d&apos;analyse:</h2>
          <div className={`mt-2 p-2 rounded ${results.analysis ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {results.analysis ? 'Initialisées avec succès' : 'Échec de l&apos;initialisation'}
          </div>
        </div>
      )}
      
      <div className="mt-6 flex space-x-4">
        <Link href="/debug/firebase" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Retour au débogueur
        </Link>
        <Link href="/" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
