import { getLatestDriverLocations } from "@/app/actions/locations"
import { DriverMap, type DriverMapLocation } from "@/components/map/driver-map"

export default async function MapPage() {
  const { data, error } = await getLatestDriverLocations()

  const locations: DriverMapLocation[] = (data as DriverMapLocation[] | null) ?? []

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Driver Locations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Live map of active driver positions. Refreshes every 60 seconds.
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-1">
            Could not load driver locations: {error}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <DriverMap locations={locations} refreshInterval={60000} />
      </div>
    </div>
  )
}
