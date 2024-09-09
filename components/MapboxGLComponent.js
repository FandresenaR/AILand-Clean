import { useEffect, useRef } from 'react'
import Script from 'next/script'

const MapboxGLComponent = ({ mapType }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const mapboxLoaded = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.mapboxgl || map.current) return;

    const initializeMap = () => {
      if (!mapboxLoaded.current) return;

      window.mapboxgl.accessToken = 'pk.eyJ1IjoiZmFuZHJlc2VuYS0yNCIsImEiOiJjbTB0b2tyMHIwdWR5MnJzajdyYjdxaHFlIn0.X_jOASRkfd478-irjDhxXg';

      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapType}`,
        center: [46.7, -19.0], // Madagascar coordinates
        zoom: 6
      });

      map.current.addControl(new window.mapboxgl.NavigationControl());

      const markers = [
        { lng: 47.5079, lat: -18.8792, name: "Antananarivo" },
        { lng: 49.2920, lat: -16.2325, name: "Toamasina" },
        { lng: 43.2203, lat: -23.3516, name: "Toliara" }
      ];

      markers.forEach(marker => {
        new window.mapboxgl.Marker()
          .setLngLat([marker.lng, marker.lat])
          .setPopup(new window.mapboxgl.Popup().setHTML(`<h3>${marker.name}</h3>`))
          .addTo(map.current);
      });
    };

    if (window.mapboxgl && mapboxLoaded.current) {
      initializeMap();
    }
  }, [mapType]);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${mapType}`);
  }, [mapType]);

  return (
    <>
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js"
        onLoad={() => {
          mapboxLoaded.current = true;
          if (window.mapboxgl && !map.current) {
            const initializeMap = () => {
              // ... (same initialization code as above)
            };
            initializeMap();
          }
        }}
      />
      <div ref={mapContainer} className="h-[400px] w-full"></div>
    </>
  )
}

export default MapboxGLComponent