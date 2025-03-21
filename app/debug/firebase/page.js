'use client';

import FirebaseDebugViewer from '../../../components/FirebaseDebugViewer';
import EnvironmentAnalysis from '../../../components/EnvironmentAnalysis';
import { useState } from 'react';

export default function FirebaseDebugPage() {
  const [showAnalysis, setShowAnalysis] = useState(true);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Débogage Firebase</h1>
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">Visualisez et analysez les données de votre base Firebase</p>
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {showAnalysis ? "Masquer l'analyse" : "Afficher l'analyse"}
        </button>
      </div>
      
      {/* Vérifier les emplacements */}
      <FirebaseDebugViewer path="locations" />
      
      {/* Vérifier les résultats d'analyse */}
      <FirebaseDebugViewer path="data/analysisResults" />
      
      {/* Tableau de bord d'analyse avancée */}
      {showAnalysis && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2 border-b pb-2">Analyse environnementale avancée</h2>
          <p className="text-gray-600 mb-4">
            Cette section présente une analyse approfondie des données environnementales, avec des visualisations et des insights pour faciliter la prise de décision.
          </p>
          <EnvironmentAnalysis />
        </div>
      )}
      
      {/* Vérifier les utilisateurs */}
      <FirebaseDebugViewer path="users" />
    </div>
  );
}
