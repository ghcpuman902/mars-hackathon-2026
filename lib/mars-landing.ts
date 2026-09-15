export type LandingSite = {
  id: string
  name: string
  lat_deg: number
  lon_east_deg: number
  archetype: string
  why_it_matters: string
  tracks: string
  elevation_m: number | null
  slope_deg_local: number | null
  ice_0_1m: number | null
  ice_1_5m: number | null
  ice_gt_5m: number | null
}

export type LandingPick = {
  lat_deg: number
  lon_east_deg: number
  siteId?: string
}

export const JEZERO: LandingPick = {
  lat_deg: 18.38,
  lon_east_deg: 77.58,
  siteId: "jezero",
}

export const formatLatLon = (lat: number, lonEast: number) => {
  const latHem = lat >= 0 ? "N" : "S"
  const lon = ((lonEast % 360) + 360) % 360
  return `${Math.abs(lat).toFixed(2)}°${latHem}  ${lon.toFixed(2)}°E`
}

export const uvToLatLon = (u: number, v: number): LandingPick => {
  const lon_east_deg = ((u % 1) + 1) % 1 * 360
  const lat_deg = v * 180 - 90
  return { lat_deg, lon_east_deg }
}

export const lonEastTo180 = (lonEast: number) => {
  const east = ((lonEast % 360) + 360) % 360
  return east > 180 ? east - 360 : east
}

export const lon180ToEast = (lon180: number) => {
  return ((lon180 % 360) + 360) % 360
}

export const latLonToUv = (lat: number, lonEast: number) => {
  const lon = ((lonEast % 360) + 360) % 360
  return { u: lon / 360, v: (lat + 90) / 180 }
}

export const nearestSite = (
  sites: LandingSite[],
  lat: number,
  lonEast: number,
  maxDeg = 3,
) => {
  let best: LandingSite | undefined
  let bestDist = maxDeg
  for (const site of sites) {
    const dlat = site.lat_deg - lat
    const dlon = ((site.lon_east_deg - lonEast + 540) % 360) - 180
    const dist = Math.hypot(dlat, dlon)
    if (dist < bestDist) {
      best = site
      bestDist = dist
    }
  }
  return best
}
