import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { vec3 } from "wgpu-matrix"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"

export const RENDERING_DEFAULTS = {
	msaa: true,
	shadingMode: "auto" as ShadingModeType,
	culling: true,
	backgroundHex: "#444",
}

const msaaAtom = atom(RENDERING_DEFAULTS.msaa)
const shadingModeAtom = atom<ShadingModeType>(RENDERING_DEFAULTS.shadingMode)
const cullingAtom = atom(RENDERING_DEFAULTS.culling)

const backgroundHexAtom = atom<string>(RENDERING_DEFAULTS.backgroundHex)
const backgroundVec3Atom = atom((get) => {
	const hex = get(backgroundHexAtom)
	const rgb = hexRgb(hex)
	return vec3.create(rgb.red / 255, rgb.green / 255, rgb.blue / 255)
})

const resetAtom = atom(null, (_, set) => {
	set(msaaAtom, RENDERING_DEFAULTS.msaa)
	set(shadingModeAtom, RENDERING_DEFAULTS.shadingMode)
	set(cullingAtom, RENDERING_DEFAULTS.culling)
})

export const renderingAtoms = {
	msaaAtom,
	shadingModeAtom,
	cullingAtom,
	resetAtom,
	backgroundHexAtom,
	backgroundVec3Atom,
}
