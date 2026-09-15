"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"

import { MarsMap2D } from "@/components/mars-map-2d"
import {
  AREA_GROUPS,
  NASA_AREA_BY_ID,
  NASA_SITE_IDS,
  ROLE_LABEL,
} from "@/lib/nasa-areas"
import { cavesNear } from "@/lib/mars-caves"
import {
  JEZERO,
  formatLatLon,
  shortSiteName,
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

const SiteTerrain = dynamic(
  () => import("@/components/site-terrain").then((mod) => mod.SiteTerrain),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-stone-400">
        Building terrain…
      </div>
    ),
  },
)

const SCENE_MODES: { id: GlobeSceneMode; label: string }[] = [
  { id: "globe", label: "3D" },
  { id: "columbus", label: "2.5D" },
  { id: "map", label: "2D" },
]

type Stage = "select" | "inspect"

export const LandingPicker = () => {
  const [sites, setSites] = useState<LandingSite[]>([])
  const [pick, setPick] = useState<LandingPick>(JEZERO)
  const [sceneMode, setSceneMode] = useState<GlobeSceneMode>("map")
  const [engine, setEngine] = useState<"cesium" | "fallback">("cesium")
  const [menuOpen, setMenuOpen] = useState(true)
  const [stage, setStage] = useState<Stage>("select")

  const nasaSites = useMemo(
    () => sites.filter((site) => NASA_SITE_IDS.includes(site.id)),
    [sites],
  )

  const selected = nasaSites.find((site) => site.id === pick.siteId)
  const area = pick.siteId ? NASA_AREA_BY_ID[pick.siteId] : undefined
  const nearbyCaves = useMemo(
    () => cavesNear(pick.lat_deg, pick.lon_east_deg, 4),
    [pick.lat_deg, pick.lon_east_deg],
  )

  const handleToggleMenu = () => {
    setMenuOpen((open) => !open)
  }

  const handleSiteClick = (site: LandingSite) => {
    setPick({
      lat_deg: site.lat_deg,
      lon_east_deg: site.lon_east_deg,
      siteId: site.id,
    })
  }

  const handleInspect = () => {
    setStage("inspect")
  }

  const handleBack = () => {
    setStage("select")
  }

  const handleFail = () => {
    setEngine("fallback")
    setSceneMode("map")
  }

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && stage === "inspect") {
        setStage("select")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [stage])

  if (stage === "inspect") {
    return (
      <div className="relative min-h-svh bg-[#140c08] text-stone-100">
        <div className="absolute inset-0">
          <SiteTerrain
            lat_deg={pick.lat_deg}
            lon_east_deg={pick.lon_east_deg}
            caves={nearbyCaves}
          />
        </div>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 sm:p-6">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            {selected?.name ?? "Custom pin"}
          </h1>
        </header>

        <aside className="pointer-events-none absolute bottom-0 left-0 z-10 w-full p-4 sm:max-w-md sm:p-6">
          <div className="pointer-events-auto rounded-lg bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-sm">
                {formatLatLon(pick.lat_deg, pick.lon_east_deg)}
              </p>
              <button
                type="button"
                className="text-sm text-stone-300 underline-offset-2 hover:underline"
                onClick={handleBack}
              >
                Back to map
              </button>
            </div>
            {selected ? (
              <p className="mt-2 text-sm text-stone-300">{selected.why_it_matters}</p>
            ) : (
              <p className="mt-2 text-sm text-stone-400">
                Terrain is MOLA, upsampled, with local roughness added so the
                ground reads at this scale.
              </p>
            )}
            {nearbyCaves.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {nearbyCaves.map((cave) => (
                  <li key={cave.id}>
                    <span className="text-teal-200">{cave.name}</span>
                    <span className="text-stone-400">
                      {` · ${cave.diameter_m} m wide`}
                      {cave.min_depth_m != null
                        ? ` · ≥${cave.min_depth_m} m deep`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-400">
                No published THEMIS cave pits in this ellipse. Arsia Mons is the
                cluster with named skylights.
              </p>
            )}
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh bg-[#140c08] text-stone-100">
      <div
        className="absolute inset-0"
        role="application"
        aria-label="Mars map of NASA landing areas. Click an ellipse to select."
      >
        {engine === "cesium" ? (
          <MarsGlobe
            pick={pick}
            sites={nasaSites}
            sceneMode={sceneMode}
            onPick={setPick}
            onFail={handleFail}
          />
        ) : (
          <MarsMap2D pick={pick} sites={nasaSites} onPick={setPick} />
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 sm:p-6">
        <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
          NASA landing areas
        </h1>
        {menuOpen ? (
          <p className="mt-1 max-w-lg text-sm text-stone-400">
            Cream ellipses are flown or shortlisted sites. Teal dots are THEMIS
            cave pits on Arsia Mons. Click an area, then inspect the ground.
          </p>
        ) : null}
      </header>

      <aside className="pointer-events-none absolute bottom-0 left-0 z-10 w-full p-4 sm:max-w-sm sm:p-6">
        <div className="pointer-events-auto max-h-[min(28rem,70svh)] overflow-y-auto rounded-lg bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-sm" aria-live="polite">
              {formatLatLon(pick.lat_deg, pick.lon_east_deg)}
            </p>
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="landing-menu"
                className="text-xs text-stone-300 underline-offset-2 hover:underline"
                onClick={handleToggleMenu}
              >
                {menuOpen ? "Hide" : "Areas"}
              </button>
            </div>
          </div>

          <div
            id="landing-menu"
            className={
              menuOpen
                ? "grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                : "grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
            }
          >
            <div className="overflow-hidden" inert={menuOpen ? undefined : true} aria-hidden={!menuOpen}>
              {selected && area ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-stone-400">{ROLE_LABEL[area.role]}</p>
                  <p className="text-stone-400">{area.source}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-400">
                  Click a cream ellipse. Those are the NASA-recommended areas.
                </p>
              )}

              <button
                type="button"
                className="mt-3 rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-900"
                onClick={handleInspect}
              >
                Inspect terrain
              </button>

              <div className="mt-4 space-y-3">
                {AREA_GROUPS.map((group) => {
                  const groupSites = nasaSites.filter((site) => {
                    const next = NASA_AREA_BY_ID[site.id]
                    return next ? group.roles.includes(next.role) : false
                  })
                  if (groupSites.length === 0) {
                    return null
                  }
                  return (
                    <div key={group.label}>
                      <p className="mb-1.5 text-xs text-stone-500">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {groupSites.map((site) => {
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
                              {shortSiteName(site.name)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
