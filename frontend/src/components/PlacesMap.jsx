/**
 * Leaflet map for saved places — styled tiles (CartoDB Positron), controlled attribution.
 */
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// CartoDB Positron — light, minimal, free (no API key)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/about-carto/">CARTO</a>'

function bboxFromCoords(coords) {
  const lats = Object.values(coords).map((c) => c.lat)
  const lons = Object.values(coords).map((c) => c.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const pad = 0.015
  return [minLon - pad, minLat - pad, maxLon + pad, maxLat + pad]
}

export default function PlacesMap({ placeCoords, placeColors = {}, className = '', showZoomControl = false }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    const coords = placeCoords && typeof placeCoords === 'object' ? placeCoords : {}
    const entries = Object.entries(coords)
    if (entries.length === 0 || !containerRef.current) return

    const bbox = bboxFromCoords(coords)
    const bounds = L.latLngBounds(
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]],
    )

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        attributionControl: true,
        zoomControl: showZoomControl,
      })
      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)
      map.attributionControl.setPrefix('')
      map.fitBounds(bounds, { padding: [8, 8], maxZoom: 14 })
      mapRef.current = map
    } else {
      mapRef.current.fitBounds(bounds, { padding: [8, 8], maxZoom: 14 })
    }

    // Circle markers per place — use placeColors to match icon (id -> hex)
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = entries.map(([id, c]) => {
      const fill = placeColors[id] || '#1F1F1F'
      return L.circleMarker([c.lat, c.lon], {
        radius: 6,
        fillColor: fill,
        color: '#1F1F1F',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(mapRef.current)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [placeCoords, placeColors, showZoomControl])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className={className} aria-hidden="true" />
}
