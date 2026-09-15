"use client"

import type { PointerEvent } from "react"

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
        src="/data/mola_4ppd_hillshade.png"
        alt="Mars MOLA hillshade. Click to set a landing site."
        className="h-full w-full cursor-crosshair object-fill"
        style={{ filter: "sepia(1) saturate(2.4) hue-rotate(-25deg) brightness(0.85)" }}
        onPointerUp={handlePointerUp}
        draggable={false}
      />
      {sites.map((site) => {
        const uv = latLonToUv(site.lat_deg, site.lon_east_deg)
        const selected = pick.siteId === site.id
        return (
          <button
            key={site.id}
            type="button"
            aria-label={site.name}
            className={
              selected
                ? "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                : "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300"
            }
            style={{ left: `${uv.u * 100}%`, top: `${(1 - uv.v) * 100}%` }}
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
      <div
        aria-hidden
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent"
        style={{ left: `${pickUv.u * 100}%`, top: `${(1 - pickUv.v) * 100}%` }}
      />
    </div>
  )
}
