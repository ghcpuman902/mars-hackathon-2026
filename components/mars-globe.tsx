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
  VerticalOrigin,
  Viewer,
} from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"

import { loadMola4ppd, sampleMolaMetres } from "@/lib/mola-heightmap"
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
const EXAGGERATION = 12
const SITE_HEIGHT_M = 400

const sceneModeToCesium = (mode: GlobeSceneMode) => {
  if (mode === "map") {
    return SceneMode.SCENE2D
  }
  if (mode === "columbus") {
    return SceneMode.COLUMBUS_VIEW
  }
  return SceneMode.SCENE3D
}

const wrapHillshadeToLon180 = async () => {
  const image = new Image()
  image.src = "/data/mola_4ppd_hillshade.png"
  await image.decode()
  const canvas = document.createElement("canvas")
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not wrap hillshade")
  }
  const half = canvas.width / 2
  context.drawImage(image, half, 0, half, canvas.height, 0, 0, half, canvas.height)
  context.drawImage(image, 0, 0, half, canvas.height, half, 0, half, canvas.height)
  return canvas.toDataURL("image/png")
}

const syncPins = (
  viewer: Viewer,
  sites: LandingSite[],
  pick: LandingPick,
) => {
  viewer.entities.removeAll()
  for (const site of sites) {
    const selected = pick.siteId === site.id
    const lon = lonEastTo180(site.lon_east_deg)
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
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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

  pickRef.current = pick
  sitesRef.current = sites
  onPickRef.current = onPick
  onFailRef.current = onFail

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
    syncPins(viewer, sites, pick)
    if (pick.siteId && pick.siteId !== lastFlownRef.current) {
      lastFlownRef.current = pick.siteId
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          lonEastTo180(pick.lon_east_deg),
          pick.lat_deg,
          520000,
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

        const [grid, hillshadeUrl] = await Promise.all([
          loadMola4ppd(),
          wrapHillshadeToLon180(),
        ])
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
                heights[row * TILE + col] = sampleMolaMetres(
                  grid,
                  lat,
                  lon180ToEast(lon180),
                )
              }
            }
            return heights
          },
        })

        const imagery = await SingleTileImageryProvider.fromUrl(hillshadeUrl, {
          rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
          ellipsoid: Ellipsoid.MARS,
          credit: "MOLA hillshade from the same MEGDR",
        })
        if (disposed) {
          return
        }

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
          baseLayer: new ImageryLayer(imagery),
          skyAtmosphere: new SkyAtmosphere(Ellipsoid.MARS),
          sceneMode: sceneModeToCesium(sceneMode),
          msaaSamples: 1,
          useBrowserRecommendedResolution: true,
          requestRenderMode: false,
        })
        if (disposed) {
          viewer.destroy()
          return
        }

        viewer.scene.globe.baseColor = Color.fromCssColorString("#c45a28")
        viewer.scene.globe.enableLighting = false
        viewer.scene.verticalExaggeration = EXAGGERATION
        viewer.scene.verticalExaggerationRelativeHeight = 0
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 250
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2.4e7
        viewer.scene.backgroundColor = Color.fromCssColorString("#140c08")
        viewer.resolutionScale = 1

        viewerRef.current = viewer
        syncPins(viewer, sitesRef.current, pickRef.current)

        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        handler.setInputAction((click: { position: Cartesian2 }) => {
          const current = viewer
          if (!current || current.isDestroyed()) {
            return
          }
          const picked = current.scene.pick(click.position)
          const entityId =
            picked &&
            typeof picked === "object" &&
            "id" in picked &&
            picked.id &&
            typeof picked.id === "object" &&
            "id" in picked.id
              ? String((picked.id as { id: string }).id)
              : undefined
          if (entityId) {
            const site = sitesRef.current.find((item) => item.id === entityId)
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
          const site = nearestSite(sitesRef.current, lat, lonEast, 2.2)
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

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            lonEastTo180(pickRef.current.lon_east_deg),
            pickRef.current.lat_deg,
            8_000_000,
          ),
          duration: 0,
        })
        lastFlownRef.current = pickRef.current.siteId
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
