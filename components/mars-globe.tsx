"use client"

import { useEffect, useRef } from "react"
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  CustomHeightmapTerrainProvider,
  Ellipsoid,
  GeographicProjection,
  GeographicTilingScheme,
  HeightReference,
  HorizontalOrigin,
  ImageryLayer,
  LabelStyle,
  Math as CesiumMath,
  Rectangle,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  SingleTileImageryProvider,
  SkyAtmosphere,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  Viewer,
} from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"

import { loadMola4ppd, sampleMolaBilinear } from "@/lib/mola-heightmap"
import { MARS_CAVES } from "@/lib/mars-caves"
import { NASA_AREA_BY_ID } from "@/lib/nasa-areas"
import {
  lon180ToEast,
  lonEastTo180,
  nearestSite,
  type LandingPick,
  type LandingSite,
} from "@/lib/mars-landing"

export type GlobeSceneMode = "globe" | "columbus" | "map"

export type MarsGlobeProps = {
  pick: LandingPick
  sites: LandingSite[]
  sceneMode: GlobeSceneMode
  onPick: (next: LandingPick) => void
  onFail?: () => void
}

const TILE = 65
const EXAGGERATION = 10
const SITE_HEIGHT_M = 400
const VIKING_TILES =
  "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"

const sceneModeToCesium = (mode: GlobeSceneMode) => {
  if (mode === "map") {
    return SceneMode.SCENE2D
  }
  if (mode === "columbus") {
    return SceneMode.COLUMBUS_VIEW
  }
  return SceneMode.SCENE3D
}

const siteRangeM = (siteId?: string) => {
  if (!siteId) {
    return 8_000_000
  }
  const area = NASA_AREA_BY_ID[siteId]
  if (!area) {
    return 280_000
  }
  return Math.max(area.ellipseKm[0] * 7000, 160_000)
}

const syncEntities = (
  viewer: Viewer,
  sites: LandingSite[],
  pick: LandingPick,
) => {
  viewer.entities.removeAll()
  for (const site of sites) {
    const selected = pick.siteId === site.id
    const lon = lonEastTo180(site.lon_east_deg)
    const area = NASA_AREA_BY_ID[site.id]
    if (area) {
      viewer.entities.add({
        id: `area-${site.id}`,
        name: site.name,
        position: Cartesian3.fromDegrees(lon, site.lat_deg),
        ellipse: {
          semiMajorAxis: area.ellipseKm[0] * 500,
          semiMinorAxis: area.ellipseKm[1] * 500,
          rotation: CesiumMath.toRadians(area.headingDeg),
          material: Color.fromCssColorString("#f4d7a8").withAlpha(
            selected ? 0.34 : 0.16,
          ),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      })
    }
    viewer.entities.add({
      id: site.id,
      name: site.name,
      position: Cartesian3.fromDegrees(lon, site.lat_deg, SITE_HEIGHT_M),
      point: {
        pixelSize: selected ? 12 : 7,
        color: selected
          ? Color.fromCssColorString("#fff6ea")
          : Color.fromCssColorString("#e8b48a"),
        outlineColor: Color.BLACK,
        outlineWidth: 1,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: site.name,
        font: "12px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(0, -18),
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        show: selected,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    })
  }

  for (const cave of MARS_CAVES) {
    viewer.entities.add({
      id: `cave-${cave.id}`,
      name: cave.name,
      position: Cartesian3.fromDegrees(
        lonEastTo180(cave.lon_east_deg),
        cave.lat_deg,
        SITE_HEIGHT_M,
      ),
      point: {
        pixelSize: 6,
        color: Color.fromCssColorString("#7de0c6"),
        outlineColor: Color.BLACK,
        outlineWidth: 1,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    })
  }
}

const applySceneMode = (viewer: Viewer, mode: GlobeSceneMode, duration: number) => {
  if (mode === "map") {
    viewer.scene.morphTo2D(duration)
    return
  }
  if (mode === "columbus") {
    viewer.scene.morphToColumbusView(duration)
    return
  }
  viewer.scene.morphTo3D(duration)
}

const entitySiteId = (raw: unknown, sites: LandingSite[]) => {
  if (!raw || typeof raw !== "object" || !("id" in raw)) {
    return undefined
  }
  const id = String((raw as { id: string }).id)
  if (id.startsWith("area-")) {
    return id.slice(5)
  }
  if (id.startsWith("cave-")) {
    return "arsia"
  }
  if (sites.some((site) => site.id === id)) {
    return id
  }
  return undefined
}

export const MarsGlobe = ({
  pick,
  sites,
  sceneMode,
  onPick,
  onFail,
}: MarsGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pickRef = useRef(pick)
  const sitesRef = useRef(sites)
  const onPickRef = useRef(onPick)
  const onFailRef = useRef(onFail)
  const viewerRef = useRef<Viewer | null>(null)
  const lastFlownRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    pickRef.current = pick
    sitesRef.current = sites
    onPickRef.current = onPick
    onFailRef.current = onFail
  }, [pick, sites, onPick, onFail])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) {
      return
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    applySceneMode(viewer, sceneMode, reduceMotion ? 0 : 0.8)
  }, [sceneMode])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) {
      return
    }
    syncEntities(viewer, sites, pick)
    if (pick.siteId && pick.siteId !== lastFlownRef.current) {
      lastFlownRef.current = pick.siteId
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          lonEastTo180(pick.lon_east_deg),
          pick.lat_deg,
          siteRangeM(pick.siteId),
        ),
        duration: reduceMotion ? 0 : 1.2,
      })
    }
  }, [pick, sites])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let disposed = false
    let viewer: Viewer | null = null

    const initialize = async () => {
      try {
        window.CESIUM_BASE_URL = "/cesium/"
        Ellipsoid.default = Ellipsoid.MARS

        const grid = await loadMola4ppd()
        if (disposed) {
          return
        }

        const tilingScheme = new GeographicTilingScheme({
          ellipsoid: Ellipsoid.MARS,
          numberOfLevelZeroTilesX: 2,
          numberOfLevelZeroTilesY: 1,
        })

        const terrainProvider = new CustomHeightmapTerrainProvider({
          width: TILE,
          height: TILE,
          tilingScheme,
          ellipsoid: Ellipsoid.MARS,
          credit: "MOLA MEGDR 4 ppd · NASA / GSFC",
          callback: (x, y, level) => {
            const rectangle = tilingScheme.tileXYToRectangle(x, y, level)
            const heights = new Float32Array(TILE * TILE)
            for (let row = 0; row < TILE; row += 1) {
              const lat = CesiumMath.toDegrees(
                rectangle.north -
                  (rectangle.north - rectangle.south) * (row / (TILE - 1)),
              )
              for (let col = 0; col < TILE; col += 1) {
                const lon180 = CesiumMath.toDegrees(
                  rectangle.west +
                    (rectangle.east - rectangle.west) * (col / (TILE - 1)),
                )
                heights[row * TILE + col] = sampleMolaBilinear(
                  grid,
                  lat,
                  lon180ToEast(lon180),
                )
              }
            }
            return heights
          },
        })

        const fallback = await SingleTileImageryProvider.fromUrl(
          "/data/mars_viking_l2.jpg",
          {
            rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
            ellipsoid: Ellipsoid.MARS,
            credit: "Viking MDIM 2.1 browse · NASA / USGS",
          },
        )
        if (disposed) {
          return
        }

        const trek = new UrlTemplateImageryProvider({
          url: VIKING_TILES,
          tilingScheme,
          minimumLevel: 0,
          maximumLevel: 7,
          tileWidth: 256,
          tileHeight: 256,
          credit: "Viking MDIM 2.1 232 m · NASA Trek / USGS",
        })

        viewer = new Viewer(container, {
          animation: false,
          timeline: false,
          geocoder: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          infoBox: false,
          selectionIndicator: false,
          homeButton: true,
          sceneModePicker: true,
          projectionPicker: true,
          navigationHelpButton: true,
          navigationInstructionsInitiallyVisible: false,
          ellipsoid: Ellipsoid.MARS,
          terrainProvider,
          mapProjection: new GeographicProjection(Ellipsoid.MARS),
          baseLayer: new ImageryLayer(fallback),
          skyAtmosphere: new SkyAtmosphere(Ellipsoid.MARS),
          sceneMode: sceneModeToCesium(sceneMode),
          msaaSamples: 4,
          useBrowserRecommendedResolution: true,
          requestRenderMode: false,
        })
        if (disposed) {
          viewer.destroy()
          return
        }

        viewer.imageryLayers.addImageryProvider(trek)
        viewer.scene.globe.baseColor = Color.fromCssColorString("#8a3a1c")
        viewer.scene.globe.enableLighting = false
        viewer.scene.globe.depthTestAgainstTerrain = true
        viewer.scene.verticalExaggeration = EXAGGERATION
        viewer.scene.verticalExaggerationRelativeHeight = 0
        viewer.scene.backgroundColor = Color.fromCssColorString("#140c08")
        viewer.resolutionScale = 1

        const cameraControl = viewer.scene.screenSpaceCameraController
        cameraControl.enableZoom = true
        cameraControl.enableTilt = true
        cameraControl.enableRotate = true
        cameraControl.enableTranslate = true
        cameraControl.enableCollisionDetection = true
        cameraControl.zoomFactor = 12
        cameraControl.inertiaZoom = 0.82
        cameraControl.inertiaSpin = 0.88
        cameraControl.minimumZoomDistance = 80
        cameraControl.maximumZoomDistance = 4.5e7
        cameraControl.minimumCollisionTerrainHeight = 400
        cameraControl.minimumPickingTerrainHeight = 200

        viewerRef.current = viewer
        syncEntities(viewer, sitesRef.current, pickRef.current)

        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        handler.setInputAction((click: { position: Cartesian2 }) => {
          const current = viewer
          if (!current || current.isDestroyed()) {
            return
          }
          const picked = current.scene.pick(click.position)
          const pickedId =
            picked && typeof picked === "object" && "id" in picked
              ? entitySiteId(picked.id, sitesRef.current)
              : undefined
          if (pickedId) {
            const site = sitesRef.current.find((item) => item.id === pickedId)
            if (site) {
              onPickRef.current({
                lat_deg: site.lat_deg,
                lon_east_deg: site.lon_east_deg,
                siteId: site.id,
              })
            }
            return
          }
          const ray = current.camera.getPickRay(click.position)
          if (!ray) {
            return
          }
          const cartesian = current.scene.globe.pick(ray, current.scene)
          if (!cartesian) {
            return
          }
          const carto = Cartographic.fromCartesian(cartesian)
          const lat = CesiumMath.toDegrees(carto.latitude)
          const lonEast = lon180ToEast(CesiumMath.toDegrees(carto.longitude))
          const site = nearestSite(sitesRef.current, lat, lonEast, 3.2)
          onPickRef.current(
            site
              ? {
                  lat_deg: site.lat_deg,
                  lon_east_deg: site.lon_east_deg,
                  siteId: site.id,
                }
              : { lat_deg: lat, lon_east_deg: lonEast },
          )
        }, ScreenSpaceEventType.LEFT_CLICK)

        const start = pickRef.current
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            lonEastTo180(start.lon_east_deg),
            start.lat_deg,
            start.siteId ? siteRangeM(start.siteId) : 8_000_000,
          ),
          duration: 0,
        })
        lastFlownRef.current = start.siteId
      } catch {
        onFailRef.current?.()
      }
    }

    void initialize()

    return () => {
      disposed = true
      viewerRef.current = null
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy()
      }
    }
  }, [])

  return <div ref={containerRef} className="cesium-mars h-full w-full" />
}

declare global {
  interface Window {
    CESIUM_BASE_URL?: string
  }
}
