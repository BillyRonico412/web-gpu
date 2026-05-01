import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { atomWithReset, RESET } from "jotai/utils"
import { vec3 } from "wgpu-matrix"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import type { DisplayModeType } from "@/routes/tp/viewer/-gpu/logic/-types"

const shadingModeAtom = atomWithReset<ShadingModeType>("auto")
const cullingAtom = atomWithReset(true)
const displayModeAtom = atomWithReset<DisplayModeType>("basic")

const backgroundHexAtom = atomWithReset<string>("#666666")
const backgroundVec3Atom = atom((get) => {
	const hex = get(backgroundHexAtom)
	const rgb = hexRgb(hex)
	return vec3.create(rgb.red / 255, rgb.green / 255, rgb.blue / 255)
})

const resetAtom = atom(null, (_, set) => {
	set(shadingModeAtom, RESET)
	set(cullingAtom, RESET)
	set(displayModeAtom, RESET)
	set(backgroundHexAtom, RESET)
})

export const renderingAtoms = {
	shadingModeAtom,
	cullingAtom,
	resetAtom,
	backgroundHexAtom,
	backgroundVec3Atom,
	displayModeAtom,
}
