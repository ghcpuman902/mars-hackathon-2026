"use client"

import type { PointerEvent } from "react"

import { NASA_AREA_BY_ID } from "@/lib/nasa-areas"
import { MARS_CAVES } from "@/lib/mars-caves"
import {
  latLonToUv,
  nearestSite,
  uvToLatLon,
  type LandingPick,
  type LandingSite,
} from "@/lib/mars-landing"

type MarsMap2DProps = {
  pick: LandingPick
  sites: LandingSite[]
  onPick: (next: LandingPick) => void
}

export const MarsMap2D = ({ pick, sites, onPick }: MarsMap2DProps) => {
  const handlePointerUp = (event: PointerEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return
    }
    const u = (event.clientX - rect.left) / rect.width
    const v = 1 - (event.clientY - rect.top) / rect.height
    const next = uvToLatLon(u, v)
    const site = nearestSite(sites, next.lat_deg, next.lon_east_deg, 3)
    onPick(
      site
        ? {
            lat_deg: site.lat_deg,
            lon_east_deg: site.lon_east_deg,
            siteId: site.id,
          }
        : next,
    )
  }

  const pickUv = latLonToUv(pick.lat_deg, pick.lon_east_deg)

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img
        src="/data/mars_viking_l2.jpg"
        alt="Mars Viking color mosaic. Click to set a landing site."
        className="h-full w-full cursor-crosshair object-fill"
        onPointerUp={handlePointerUp}
        draggable={false}
      />
      {sites.map((site) => {
        const uv = latLonToUv(site.lat_deg, site.lon_east_deg)
        const selected = pick.siteId === site.id
        const area = NASA_AREA_BY_ID[site.id]
        const widthPct = area ? (area.ellipseKm[0] / (360 * 59)) * 100 : 1.2
        const heightPct = area ? (area.ellipseKm[1] / (180 * 59)) * 100 : 1.2
        return (
          <button
            key={site.id}
            type="button"
            aria-label={site.name}
            aria-pressed={selected}
            className={
              selected
                ? "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/25"
                : "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/70 bg-amber-100/15"
            }
            style={{
              left: `${uv.u * 100}%`,
              top: `${(1 - uv.v) * 100}%`,
              width: `${Math.max(widthPct, 1.1)}%`,
              height: `${Math.max(heightPct, 1.8)}%`,
            }}
            onClick={() =>
              onPick({
                lat_deg: site.lat_deg,
                lon_east_deg: site.lon_east_deg,
                siteId: site.id,
              })
            }
          />
        )
      })}
      {MARS_CAVES.map((cave) => {
        const uv = latLonToUv(cave.lat_deg, cave.lon_east_deg)
        return (
          <span
            key={cave.id}
            aria-hidden
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300"
            style={{ left: `${uv.u * 100}%`, top: `${(1 - uv.v) * 100}%` }}
          />
        )
      })}
      <div
        aria-hidden
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent"
        style={{ left: `${pickUv.u * 100}%`, top: `${(1 - pickUv.v) * 100}%` }}
      />
    </div>
  )
}
