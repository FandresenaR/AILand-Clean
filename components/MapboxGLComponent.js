import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const mapboxgl = dynamic(() => import('mapbox-gl'), { ssr: false });

const MapboxGLComponent = ({ mapType }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || map.current) return;

    const initializeMap = async () => {
      const mapboxgl = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');

      mapboxgl.accessToken = 'pk.eyJ1IjoiZmFuZHJlc2VuYS0yNCIsImEiOiJjbTB0b2tyMHIwdWR5MnJzajdyYjdxaHFlIn0.X_jOASRkfd478-irjDhxXg';

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapType}`,
        center: [46.7, -19.0], // Madagascar coordinates
        zoom: 6
      });

      map.current.addControl(new mapboxgl.NavigationControl());

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
    };

    initializeMap();
  }, [mapType]);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${mapType}`);
  }, [mapType]);

  return <div ref={mapContainer} className="h-[400px] w-full"></div>
}

export default MapboxGLComponent;