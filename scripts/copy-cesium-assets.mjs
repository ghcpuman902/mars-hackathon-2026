import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(root, "node_modules/cesium/Build/Cesium")
const dest = join(root, "public/cesium")

for (const dir of ["Workers", "ThirdParty", "Assets", "Widgets"]) {
  mkdirSync(join(dest, dir), { recursive: true })
  cpSync(join(src, dir), join(dest, dir), { recursive: true })
}
