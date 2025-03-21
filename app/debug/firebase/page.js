'use client';

import FirebaseDebugViewer from '../../../components/FirebaseDebugViewer';
import EnvironmentAnalysis from '../../../components/EnvironmentAnalysis';
import Link from 'next/link';
import { useState } from 'react';

export default function FirebaseDebugPage() {
  const [showAnalysis, setShowAnalysis] = useState(true);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Débogage Firebase</h1>
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-white">Visualisez et analysez les données de votre base Firebase</p>
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow"
        >
          {showAnalysis ? "Masquer l'analyse" : "Afficher l'analyse"}
        </button>
      </div>
      
      {/* Actions rapides */}
      <div className="mb-6 flex space-x-4">
        <Link href="/debug/import-data" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow transition-colors">
          Importer des données
        </Link>
        <Link href="/debug/init-data" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow transition-colors">
          Initialiser des données
        </Link>
        <Link href="/" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded shadow transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>
      
      {/* Vérifier les emplacements */}
      <FirebaseDebugViewer path="locations" />
      
      {/* Vérifier les résultats d'analyse */}
      <FirebaseDebugViewer path="data/analysisResults" />
      
      {/* Tableau de bord d'analyse avancée */}
      {showAnalysis && (
        <div className="mt-6 bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2 border-b border-gray-700 pb-2 text-white">Analyse environnementale avancée</h2>
          <p className="text-gray-300 mb-4">
            Cette section présente une analyse approfondie des données environnementales, avec des visualisations et des insights pour faciliter la prise de décision.
          </p>
          <EnvironmentAnalysis darkMode={true} />
        </div>
      )}
      
      {/* Vérifier les utilisateurs */}
      <FirebaseDebugViewer path="users" />
    </div>
  );
}
