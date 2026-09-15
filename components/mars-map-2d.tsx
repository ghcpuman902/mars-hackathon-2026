"use client"

import { useRef } from "react"
import type { PointerEvent } from "react"

import { NASA_AREA_BY_ID } from "@/lib/nasa-areas"
import { MARS_CAVES } from "@/lib/mars-caves"
import {
  latLonToUv,
  shortSiteName,
  uvToLatLon,
  type CustomSite,
  type LandingPick,
  type LandingSite,
} from "@/lib/mars-landing"

type MarsMap2DProps = {
  pick: LandingPick
  sites: LandingSite[]
  customSites: CustomSite[]
  onPick: (next: LandingPick) => void
  onCustomAdd: (lat_deg: number, lon_east_deg: number) => void
}

const LONG_PRESS_MS = 550

export const MarsMap2D = ({
  pick,
  sites,
  customSites,
  onPick,
  onCustomAdd,
}: MarsMap2DProps) => {
  const pressTimerRef = useRef<number | undefined>(undefined)
  const didLongPressRef = useRef(false)

  const pointFromEvent = (event: PointerEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return undefined
    }
    const u = (event.clientX - rect.left) / rect.width
    const v = 1 - (event.clientY - rect.top) / rect.height
    return uvToLatLon(u, v)
  }

  const handlePointerDown = (event: PointerEvent<HTMLImageElement>) => {
    didLongPressRef.current = false
    const next = pointFromEvent(event)
    if (!next) {
      return
    }
    pressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true
      onCustomAdd(next.lat_deg, next.lon_east_deg)
    }, LONG_PRESS_MS)
  }

  const handlePointerCancel = () => {
    if (pressTimerRef.current !== undefined) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = undefined
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLImageElement>) => {
    handlePointerCancel()
    if (didLongPressRef.current) {
      didLongPressRef.current = false
      return
    }
    const next = pointFromEvent(event)
    if (!next) {
      return
    }
    const site = sites.find((item) => {
      const dlat = item.lat_deg - next.lat_deg
      const dlon = ((item.lon_east_deg - next.lon_east_deg + 540) % 360) - 180
      return Math.hypot(dlat, dlon) < 4
    })
    if (site) {
      onPick({
        lat_deg: site.lat_deg,
        lon_east_deg: site.lon_east_deg,
        siteId: site.id,
      })
    }
  }

  const pickUv = latLonToUv(pick.lat_deg, pick.lon_east_deg)

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img
        src="/data/mars_viking_l2.jpg"
        alt="Mars Viking color mosaic. Click a label to select. Long-press to add a custom site."
        className="h-full w-full cursor-crosshair object-fill"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
            className="absolute -translate-x-1/2 -translate-y-[calc(100%+0.35rem)]"
            style={{ left: `${uv.u * 100}%`, top: `${(1 - uv.v) * 100}%` }}
            onClick={() =>
              onPick({
                lat_deg: site.lat_deg,
                lon_east_deg: site.lon_east_deg,
                siteId: site.id,
              })
            }
          >
            <span
              className={
                selected
                  ? "rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-stone-100"
                  : "rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-stone-200"
              }
            >
              {shortSiteName(site.name)}
            </span>
            <span
              aria-hidden
              className={
                selected
                  ? "absolute left-1/2 top-full mt-1 size-2 -translate-x-1/2 rounded-full bg-white"
                  : "absolute left-1/2 top-full mt-1 size-1.5 -translate-x-1/2 rounded-full bg-orange-300"
              }
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full -z-10 -translate-x-1/2 rounded-full border border-amber-100/40 bg-amber-100/10"
              style={{
                width: `${Math.max(widthPct, 1.1)}vw`,
                height: `${Math.max(heightPct, 1.4)}vw`,
                marginTop: "0.35rem",
              }}
            />
          </button>
        )
      })}
      {customSites.map((site) => {
        const uv = latLonToUv(site.lat_deg, site.lon_east_deg)
        const selected = pick.siteId === site.id
        return (
          <button
            key={site.id}
            type="button"
            aria-label="Custom site"
            aria-pressed={selected}
            className="absolute -translate-x-1/2 -translate-y-[calc(100%+0.35rem)]"
            style={{ left: `${uv.u * 100}%`, top: `${(1 - uv.v) * 100}%` }}
            onClick={() =>
              onPick({
                lat_deg: site.lat_deg,
                lon_east_deg: site.lon_east_deg,
                siteId: site.id,
              })
            }
          >
            <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-amber-100">
              Custom
            </span>
          </button>
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
