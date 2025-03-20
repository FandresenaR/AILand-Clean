'use client';

import { useState, useRef } from 'react';
import { importCustomData } from '../../../scripts/import-custom-data';
import Link from 'next/link';

export default function ImportDataPage() {
  const [status, setStatus] = useState({ loading: false, success: false, error: null, result: null });
  const [jsonData, setJsonData] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileLoading(true);
      setJsonFile(file);
      console.log("Fichier sélectionné:", file.name, "Taille:", file.size, "bytes");
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          console.log("Contenu du fichier chargé. Longueur:", content.length);
          console.log("Début du contenu:", content.substring(0, 100) + "...");
          
          // S'assurer que le contenu n'est pas vide
          if (!content || content.trim() === '') {
            throw new Error("Le fichier est vide");
          }
          
          // Essayer de détecter le format - on accepte même du JSON mal formé
          let isValidFormat = true;
          try {
            // Essai d'analyse JSON
            JSON.parse(content);
            console.log("Le contenu du fichier est du JSON valide");
          } catch (jsonError) {
            console.error("Avertissement: Le fichier n'est pas du JSON standard:", jsonError.message);
            console.log("Nous allons tenter de le traiter quand même...");
            isValidFormat = false;
          }
          
          setJsonData(content);
          setFileLoading(false);
          setStatus(prev => ({ 
            ...prev, 
            error: isValidFormat ? null : "Le fichier n'est pas du JSON standard, mais nous allons tenter de l'analyser."
          }));
        } catch (error) {
          console.error("Erreur lors de la lecture du fichier:", error);
          setStatus(prev => ({ ...prev, error: error.message || "Format de fichier invalide" }));
          setJsonData('');
          setFileLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error("Erreur de FileReader:", error);
        setStatus(prev => ({ ...prev, error: "Erreur lors de la lecture du fichier" }));
        setJsonData('');
        setFileLoading(false);
      };
      
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      setStatus({ loading: false, success: false, error: "Veuillez fournir des données JSON valides", result: null });
      return;
    }

    try {
      setStatus({ loading: true, success: false, error: null, result: null });
      
      // Analyser les données JSON avec gestion d'erreur améliorée
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (parseError) {
        console.error("Erreur d'analyse JSON standard:", parseError);
        console.log("Tentative de nettoyage et de réanalyse...");
        
        // Tentative de nettoyage et de réparation des données
        try {
          // Option 1: Si les guillemets sont échappés (\"...)
          const cleanedJson = jsonData.replace(/\\"/g, '"');
          parsedData = JSON.parse(cleanedJson);
          console.log("Réparation du JSON réussie (guillemets nettoyés)");
        } catch (e1) {
          try {
            // Option 2: Si le JSON est un tableau sans crochets externes
            const withBrackets = `[${jsonData}]`;
            parsedData = JSON.parse(withBrackets);
            console.log("Réparation du JSON réussie (ajout de crochets)");
          } catch (e2) {
            // Si toutes les tentatives échouent, essayer d'envoyer les données brutes
            console.log("Toutes les tentatives de réparation ont échoué, envoi des données brutes");
            parsedData = jsonData;
          }
        }
      }
      
      // Importer les données
      const result = await importCustomData(parsedData);
      
      if (result.success) {
        setStatus({ 
          loading: false, 
          success: true,
          error: null,
          result
        });
      } else {
        throw new Error(result.error || "Échec de l'importation");
      }
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      setStatus({ loading: false, success: false, error: error.message, result: null });
    }
  };

  const clearFile = () => {
    setJsonFile(null);
    setJsonData('');
    setStatus(prev => ({ ...prev, error: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Vérifier si le bouton devrait être activé
  const isImportButtonDisabled = status.loading || fileLoading || !jsonData.trim();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Importation de données personnalisées</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Information</p>
        <p>Cette page vous permet d'importer vos propres données JSON dans Firebase.</p>
        <p>Les données seront converties au format attendu par l'application.</p>
      </div>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Charger un fichier JSON:
          </label>
          <div className="flex items-center">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              className="shadow border rounded py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
            {jsonFile && (
              <button 
                onClick={clearFile} 
                className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Effacer
              </button>
            )}
          </div>
          {fileLoading && (
            <div className="mt-2 text-blue-600 flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement du fichier...
            </div>
          )}
          {jsonFile && !fileLoading && (
            <div className="mt-2 text-green-600">
              Fichier chargé: {jsonFile.name} ({Math.round(jsonFile.size / 1024)} Ko)
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Ou collez votre JSON ici:
          </label>
          <textarea 
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            rows={10}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Collez vos données JSON ici..."
          />
        </div>
        
        <button 
          onClick={handleImport}
          disabled={isImportButtonDisabled}
          className={`px-4 py-2 rounded font-bold ${
            isImportButtonDisabled
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {status.loading ? 'Importation en cours...' : 'Importer les données'}
        </button>
        
        {isImportButtonDisabled && !status.loading && !fileLoading && (
          <p className="text-red-500 text-sm mt-2">
            Veuillez d'abord charger un fichier JSON valide ou coller du JSON valide
          </p>
        )}
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
          <p>Les données ont été importées avec succès dans votre base de données Firebase.</p>
          
          {status.result && (
            <div className="mt-2">
              <p><strong>Emplacements importés:</strong> {status.result.locationsCount}</p>
              <p><strong>Régions identifiées:</strong> {status.result.regionsCount}</p>
            </div>
          )}
          
          <div className="mt-4">
            <Link href="/debug/firebase" className="text-blue-600 hover:text-blue-800 underline">
              Voir les données →
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex space-x-4">
        <Link href="/debug/firebase" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Retour au débogueur
        </Link>
        <Link href="/" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
