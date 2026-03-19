"use client"

import { useEffect, useRef, useCallback, useMemo, useState } from "react"
import { getLatestDriverLocations } from "@/app/actions/locations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DriverMapLocation {
  driver_id: string
  driver_name: string
  latitude: number
  longitude: number
  timestamp: string
}

interface DriverMapProps {
  locations: DriverMapLocation[]
  refreshInterval?: number
}

// Johannesburg-DRC midpoint region
const DEFAULT_CENTER: [number, number] = [-15.0, 28.0]
const DEFAULT_ZOOM = 5
const FOCUSED_ZOOM = 14
const FIT_BOUNDS_PADDING: [number, number] = [40, 40]

export function DriverMap({ locations, refreshInterval = 60000 }: DriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map())
  const locationsRef = useRef(locations)
  const [selectedDriverId, setSelectedDriverId] = useState<string>("all")

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.driver_name.localeCompare(b.driver_name)),
    [locations]
  )

  const focusSelectedDriver = useCallback(
    (
      map: import("leaflet").Map,
      locs: DriverMapLocation[],
      selectedId: string,
      shouldAnimate = true
    ) => {
      if (!locs.length) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }

      if (selectedId !== "all") {
        const selected = locs.find((loc) => loc.driver_id === selectedId)
        if (selected) {
          map.flyTo([selected.latitude, selected.longitude], FOCUSED_ZOOM, {
            animate: shouldAnimate,
            duration: shouldAnimate ? 0.8 : 0,
          })
          markersRef.current.get(selected.driver_id)?.openPopup()
          return
        }
      }

      if (locs.length === 1) {
        const only = locs[0]
        map.setView([only.latitude, only.longitude], FOCUSED_ZOOM)
        return
      }

      const bounds = locs.map((loc) => [loc.latitude, loc.longitude] as [number, number])
      map.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING, maxZoom: 12 })
    },
    []
  )

  const updateMarkers = useCallback(
    (L: typeof import("leaflet"), map: import("leaflet").Map, locs: DriverMapLocation[]) => {
      // Remove existing markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()

      locs.forEach((loc) => {
        const lastUpdate = new Date(loc.timestamp).toLocaleString()
        const marker = L.marker([loc.latitude, loc.longitude])
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <strong>${loc.driver_name}</strong><br/>
              <span style="color:#666;font-size:12px">Last update:<br/>${lastUpdate}</span>
            </div>`
          )
        markersRef.current.set(loc.driver_id, marker)
      })
    },
    []
  )

  useEffect(() => {
    locationsRef.current = locations
  }, [locations])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Keep map view in sync whenever data or selected driver changes.
    focusSelectedDriver(map, locationsRef.current, selectedDriverId, false)
  }, [selectedDriverId, locations, focusSelectedDriver])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let map: import("leaflet").Map
    let interval: ReturnType<typeof setInterval>

    import("leaflet").then((L) => {
      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      map = L.map(mapRef.current!).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      updateMarkers(L, map, locationsRef.current)
      focusSelectedDriver(map, locationsRef.current, selectedDriverId, false)

      // Auto-refresh locations
      interval = setInterval(async () => {
        const result = await getLatestDriverLocations()
        if (result.data) {
          const refreshed = result.data as DriverMapLocation[]
          locationsRef.current = refreshed
          updateMarkers(L, map, refreshed)
          focusSelectedDriver(map, refreshed, selectedDriverId)
        }
      }, refreshInterval)
    })

    return () => {
      clearInterval(interval)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [refreshInterval, updateMarkers, focusSelectedDriver, selectedDriverId])

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="relative z-20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Focus Driver</p>
          <p className="text-xs text-gray-500">
            Choose a driver to zoom directly to their latest pin location.
          </p>
        </div>
        <div className="w-full sm:w-[320px]">
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose driver" />
            </SelectTrigger>
            <SelectContent className="z-[1200]">
              <SelectItem value="all">All drivers</SelectItem>
              {sortedLocations.map((loc) => (
                <SelectItem key={loc.driver_id} value={loc.driver_id}>
                  {loc.driver_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        ref={mapRef}
        className="relative z-0 w-full flex-1 rounded-lg"
        style={{ minHeight: "500px" }}
        aria-label="Driver location map"
      />
    </div>
  )
}
