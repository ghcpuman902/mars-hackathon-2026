"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { MarsMap2D } from "@/components/mars-map-2d"
import {
  JEZERO,
  formatLatLon,
  type LandingPick,
  type LandingSite,
} from "@/lib/mars-landing"
import type { GlobeSceneMode } from "@/components/mars-globe"

const MarsGlobe = dynamic(
  () => import("@/components/mars-globe").then((mod) => mod.MarsGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-stone-400">
        Loading Mars…
      </div>
    ),
  },
)

const FEATURED_IDS = [
  "jezero",
  "oxia",
  "hellas",
  "arcadia",
  "deuteronilus",
  "valles",
  "isidis",
  "pavonis",
] as const

const SCENE_MODES: { id: GlobeSceneMode; label: string }[] = [
  { id: "globe", label: "3D" },
  { id: "columbus", label: "2.5D" },
  { id: "map", label: "2D" },
]

export const LandingPicker = () => {
  const [sites, setSites] = useState<LandingSite[]>([])
  const [pick, setPick] = useState<LandingPick>(JEZERO)
  const [sceneMode, setSceneMode] = useState<GlobeSceneMode>("globe")
  const [engine, setEngine] = useState<"cesium" | "fallback">("cesium")

  useEffect(() => {
    const handleLoad = async () => {
      const response = await fetch("/data/sites_scored.json")
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as { sites: LandingSite[] }
      setSites(payload.sites)
    }
    void handleLoad()
  }, [])

  const selected = sites.find((site) => site.id === pick.siteId)
  const featured = FEATURED_IDS.map((id) =>
    sites.find((site) => site.id === id),
  ).filter((site): site is LandingSite => Boolean(site))

  const handleSiteClick = (site: LandingSite) => {
    setPick({
      lat_deg: site.lat_deg,
      lon_east_deg: site.lon_east_deg,
      siteId: site.id,
    })
  }

  const handleFail = () => {
    setEngine("fallback")
    setSceneMode("map")
  }

  return (
    <div className="relative min-h-svh bg-[#140c08] text-stone-100">
      <div
        className="absolute inset-0"
        role="application"
        aria-label="Mars map. Click to set a landing site."
      >
        {engine === "cesium" ? (
          <MarsGlobe
            pick={pick}
            sites={sites}
            sceneMode={sceneMode}
            onPick={setPick}
            onFail={handleFail}
          />
        ) : (
          <MarsMap2D pick={pick} sites={sites} onPick={setPick} />
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 sm:p-6">
        <p className="text-sm text-stone-400">Architecture · buried habitat</p>
        <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
          Pick a landing site
        </h1>
        <p className="mt-1 max-w-lg text-sm text-stone-400">
          {engine === "cesium"
            ? "Left-drag orbits or pans. Right-drag tilts. Scroll zooms. 3D is the sphere; 2.5D and 2D project the same MOLA mesh."
            : "Click the map or a named pin."}{" "}
          Pack A weather is a Jezero-band series.
        </p>
      </header>

      <aside className="absolute bottom-0 left-0 z-10 w-full p-4 sm:max-w-sm sm:p-6">
        <div className="rounded-lg border border-white/15 bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-stone-400">Target</p>
            <div className="flex gap-1" role="group" aria-label="Map projection">
              {SCENE_MODES.map((mode) => {
                const active = sceneMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-900"
                        : "rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-stone-100"
                    }
                    onClick={() => {
                      if (engine === "fallback" && mode.id !== "map") {
                        setEngine("cesium")
                      }
                      setSceneMode(mode.id)
                    }}
                  >
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="font-mono text-sm" aria-live="polite">
            {formatLatLon(pick.lat_deg, pick.lon_east_deg)}
          </p>
          {selected ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium">{selected.name}</p>
              <p className="text-stone-400">{selected.why_it_matters}</p>
              <p className="text-stone-400">
                {selected.elevation_m != null
                  ? `${Math.round(selected.elevation_m)} m`
                  : "elevation unknown"}
                {selected.ice_0_1m != null
                  ? ` · ice 0–1 m ${selected.ice_0_1m.toFixed(2)}`
                  : " · ice n/a"}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-400">
              Custom pin. No SWIM/MOLA sample at this click yet.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {featured.map((site) => {
              const active = pick.siteId === site.id
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => handleSiteClick(site)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-900"
                      : "rounded-full border border-white/20 px-3 py-1 text-xs text-stone-100"
                  }
                >
                  {site.name.replace(" crater", "").replace(" Planitia", "")}
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
