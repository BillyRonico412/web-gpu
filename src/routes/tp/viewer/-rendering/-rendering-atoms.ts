import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { vec3 } from "wgpu-matrix"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"

export const RENDERING_DEFAULTS = {
	fxaa: true,
	shadingMode: "auto" as ShadingModeType,
	culling: true,
	backgroundHex: "#444",
}

const fxaaAtom = atom(RENDERING_DEFAULTS.fxaa)
const shadingModeAtom = atom<ShadingModeType>(RENDERING_DEFAULTS.shadingMode)
const cullingAtom = atom(RENDERING_DEFAULTS.culling)

const backgroundHexAtom = atom<string>(RENDERING_DEFAULTS.backgroundHex)
const backgroundVec3Atom = atom((get) => {
	const hex = get(backgroundHexAtom)
	const rgb = hexRgb(hex)
	return vec3.create(rgb.red / 255, rgb.green / 255, rgb.blue / 255)
})

const resetAtom = atom(null, (_, set) => {
	set(fxaaAtom, RENDERING_DEFAULTS.fxaa)
	set(shadingModeAtom, RENDERING_DEFAULTS.shadingMode)
	set(cullingAtom, RENDERING_DEFAULTS.culling)
	set(backgroundHexAtom, RENDERING_DEFAULTS.backgroundHex)
})

export const renderingAtoms = {
	fxaaAtom,
	shadingModeAtom,
	cullingAtom,
	resetAtom,
	backgroundHexAtom,
	backgroundVec3Atom,
}
