'use client'

import { useEffect, useRef, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

// Replace with your actual Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoiZmFuZHJlc2VuYS0yNCIsImEiOiJjbTB0b2tyMHIwdWR5MnJzajdyYjdxaHFlIn0.X_jOASRkfd478-irjDhxXg';

mapboxgl.accessToken = mapboxAccessToken;

export default function Home() {
  const [darkMode, setDarkMode] = useState(true)
  const [mapType, setMapType] = useState('satellite-v9')
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [latrineData, setLatrineData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapType}`,
      center: [46.7, -19.0], // Madagascar coordinates
      zoom: 6
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add some example markers
    const markers = [
      { lng: 47.5079, lat: -18.8792, name: "Antananarivo" },
      { lng: 49.2920, lat: -16.2325, name: "Toamasina" },
      { lng: 43.2203, lat: -23.3516, name: "Toliara" }
    ];

    markers.forEach(marker => {
      new mapboxgl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${marker.name}</h3>`))
        .addTo(map.current);
    });
  }, []);

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.setStyle(`mapbox://styles/mapbox/${mapType}`);
  }, [mapType]);

  useEffect(() => {
    const fetchLatrineData = async () => {
      setIsLoading(true)
      try {
        // Replace this with your actual API call
        // const response = await fetch('your-api-endpoint')
        // const data = await response.json()
        // setLatrineData(data)

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleMapType = () => {
    setMapType(prevType => prevType === 'satellite-v9' ? 'streets-v11' : 'satellite-v9')
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <header className={`p-4 rounded-full shadow-lg flex justify-between items-center max-w-6xl mx-auto my-4 ${
        darkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' 
          : 'bg-gradient-to-r from-white to-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center">
          <img src="/logo.png" alt="AiLandClean Logo" className="h-10 mr-4" />
          <h1 className="text-2xl font-light font-montserrat-alternates">AiLandClean</h1>
        </div>
        <div className="flex space-x-4">
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
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div ref={mapContainer} className="h-[400px] w-full"></div>
        </div>
        <div className={`bg-white rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800' : ''}`}>
          <h2 className="text-2xl font-bold font-montserrat-alternates">Latrine Distribution by Region</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-xl">Loading data...</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-between items-center">
              <div className="w-full md:w-1/2">
                <PieChart width={400} height={400}>
                  <Pie
                    data={latrineData}
                    cx={200}
                    cy={200}
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {latrineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
              <div className="w-full md:w-1/2">
                <h3 className="text-xl font-semibold font-montserrat-alternates">Key Insights:</h3>
                <ul className="list-disc pl-5">
                  <li>{latrineData[0]?.name} has the highest number of latrines ({latrineData[0]?.value})</li>
                  <li>{latrineData[2]?.name} has the lowest number of latrines ({latrineData[2]?.value})</li>
                  <li>There's a significant disparity between regions</li>
                </ul>
                <p className="mt-4">
                  This data can help prioritize regions for latrine construction and 
                  maintenance efforts, focusing on areas with the greatest need.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}