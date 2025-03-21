'use client'

import { useEffect, useRef, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import dynamic from 'next/dynamic'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import Image from 'next/image'
import Link from 'next/link'
import { Montserrat_Alternates } from 'next/font/google'

// Chargement dynamique des composants d'analyse
const MapboxGLComponent = dynamic(() => import('@/components/MapboxGLComponent'), {
  ssr: false,
  loading: () => <p>Loading Map...</p>
})

const EnvironmentAnalysis = dynamic(() => import('@/components/EnvironmentAnalysis'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse p-8 mb-8 bg-gray-100 rounded-lg">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded mb-4"></div>
    </div>
  )
})

const DetailedAnalysisSection = dynamic(() => import('@/components/DetailedAnalysisSection'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-80 bg-gray-200 rounded"></div>
})

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-montserrat-alternates',
})

export default function Home() {
  // State management
  const [darkMode, setDarkMode] = useState(true)
  const [mapType, setMapType] = useState(darkMode ? 'dark-v10' : 'light-v10')
  const [latrineData, setLatrineData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Fetch latrine data (simulated with setTimeout)
  useEffect(() => {
    const fetchLatrineData = async () => {
      setIsLoading(true)
      try {
        // Simulating API call with setTimeout
        setTimeout(() => {
          setLatrineData([
            { name: 'Antananarivo', value: 250 },
            { name: 'Toamasina', value: 180 },
            { name: 'Toliara', value: 120 },
            { name: 'Mahajanga', value: 150 },
            { name: 'Fianarantsoa', value: 200 },
          ])
          setIsLoading(false)
        }, 2000)
      } catch (error) {
        console.error('Error fetching latrine data:', error)
        setIsLoading(false)
      }
    }

    fetchLatrineData()
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    setMapType(prevType => darkMode ? 'light-v10' : 'dark-v10')
  }

  // Toggle map type (satellite or streets)
  const toggleMapType = () => {
    setMapType(prevType => 
      prevType === 'satellite-v9' ? (darkMode ? 'dark-v10' : 'light-v10') : 'satellite-v9'
    )
  }

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} ${montserratAlternates.variable} font-sans`}>
      <main className="p-4 font-sans">
        {/* Header section */}
        <header className={`p-4 rounded-full flex justify-between items-center max-w-6xl mx-auto mb-4 shadow-md ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' 
            : 'bg-gradient-to-r from-white to-gray-100 text-gray-900'
        }`}>
          {/* Logo and title */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="AiLandClean Logo"
              width={40}
              height={40}
              className="mr-4"
            />
            <h1 className="text-2xl font-light font-montserrat-alternates">AiLandClean</h1>
          </div>
          {/* Controls: Map type toggle and dark mode toggle */}
          <div className="flex space-x-4">
            {/* Map type toggle button */}
            <button
              className={`px-4 py-2 rounded-full transition-colors text-sm ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={toggleMapType}
            >
              {mapType === 'satellite-v9' ? 'Switch to Streets' : 'Switch to Satellite'}
            </button>
            
            {/* Bouton d'importation de données - NOUVEAU */}
            <Link
              href="/debug/import-data"
              className={`px-4 py-2 rounded-full transition-colors text-sm ${
                darkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Importer des données
            </Link>
            
            {/* Toggle pour afficher/masquer l'analyse */}
            <button
              className={`px-4 py-2 rounded-full transition-colors text-sm ${
                darkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              {showAnalysis ? 'Masquer analyses' : 'Voir analyses'}
            </button>
            
            {/* Dark mode toggle switch */}
            <div className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 ease-in-out">
              <button
                className="absolute inset-0 flex items-center justify-between p-1"
                onClick={toggleDarkMode}
              >
                <span className={`w-5 h-5 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-700'} flex items-center justify-center transition-colors duration-300 ease-in-out`}>
                  <SunIcon className="h-3 w-3" />
                </span>
                <span className={`w-5 h-5 rounded-full ${darkMode ? 'bg-gray-900 text-blue-200' : 'bg-gray-300 text-gray-500'} flex items-center justify-center transition-colors duration-300 ease-in-out`}>
                  <MoonIcon className="h-3 w-3" />
                </span>
              </button>
              <div 
                className={`absolute w-7 h-7 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                  darkMode ? 'translate-x-full' : 'translate-x-0'
                }`}
              ></div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-4">
          {/* Map container */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <MapboxGLComponent mapType={mapType} />
          </div>
          
          {/* Latrine distribution section */}
          <div className={`rounded-lg shadow-lg p-6 mb-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <h2 className="text-2xl font-bold font-montserrat-alternates mb-4">Latrine Distribution by Region</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <p className="text-xl">Loading data...</p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-between items-center">
                {/* Pie chart */}
                <div className="w-full md:w-1/2">
                  <PieChart width={400} height={400}>
                    <Pie
                      data={latrineData}
                      cx={200}
                      cy={180}
                      labelLine={false}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {latrineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : 'white', color: darkMode ? 'white' : 'black' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </div>
                {/* Key insights */}
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-semibold font-montserrat-alternates mb-2">Key Insights:</h3>
                  <ul className="list-disc pl-5 mb-4">
                    <li>{latrineData[0]?.name} has the highest number of latrines ({latrineData[0]?.value})</li>
                    <li>{latrineData[2]?.name} has the lowest number of latrines ({latrineData[2]?.value})</li>
                    <li>There&apos;s a significant disparity between regions</li>
                  </ul>
                  <p>
                    This data can help prioritize regions for latrine construction and 
                    maintenance efforts, focusing on areas with the greatest need.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Section d'analyse environnementale (conditionnelle) */}
          {showAnalysis && (
            <div className={`rounded-lg shadow-lg overflow-hidden mb-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
              <div className="p-6">
                <h2 className="text-2xl font-bold font-montserrat-alternates mb-4">Analyse Environnementale</h2>
                <p className="mb-4">
                  Visualisation complète des données environnementales pour Madagascar, mettant en évidence les zones à risque et les tendances de pollution.
                </p>
              </div>
              
              {/* Intégration du composant d'analyse environnementale */}
              <EnvironmentAnalysis darkMode={darkMode} />
              
              {/* Intégration du composant d'analyse détaillée */}
              <DetailedAnalysisSection darkMode={darkMode} />
              
              {/* Section d'insights additionnels */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold font-montserrat-alternates mb-3">Perspectives et Recommandations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                    <h4 className="font-bold mb-2">Facteurs de risque environnementaux</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Manque d&apos;infrastructures sanitaires dans les zones urbaines à forte densité</li>
                      <li>Pollution des eaux de surface dans les régions côtières</li>
                      <li>Déforestation et érosion des sols dans les zones forestières</li>
                      <li>Vulnérabilité accrue aux événements climatiques extrêmes</li>
                    </ul>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                    <h4 className="font-bold mb-2">Actions prioritaires</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Installation de 500 nouvelles latrines dans les zones rurales critiques</li>
                      <li>Développement de systèmes de traitement des eaux usées dans les villes côtières</li>
                      <li>Campagnes de sensibilisation sur les pratiques d&apos;hygiène</li>
                      <li>Reboisement dans les zones à forte érosion</li>
                    </ul>
                  </div>
                </div>
                
                <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-purple-900' : 'bg-purple-50'}`}>
                  <h4 className="font-bold mb-2">Impact social et économique</h4>
                  <p>
                    L&apos;amélioration des conditions sanitaires pourrait réduire les maladies d&apos;origine hydrique de 35% 
                    et augmenter la productivité économique de 12% dans les régions ciblées. Chaque dollar investi 
                    dans l&apos;assainissement génère un retour de 5,5 dollars en termes de réduction des coûts de santé 
                    et d&apos;augmentation de la productivité.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}