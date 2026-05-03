import { atom } from "jotai"
import { atomWithReset, RESET } from "jotai/utils"
import { type Vec4, vec4 } from "wgpu-matrix"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import type {
	DisplayModeType,
	TechnicalConfig,
} from "@/routes/tp/viewer/-gpu/logic/-types"

const shadingModeAtom = atomWithReset<ShadingModeType>("auto")
const cullingAtom = atomWithReset(true)
const displayModeAtom = atomWithReset<DisplayModeType>("basic")

const technicalConfigAtom = atomWithReset<TechnicalConfig>({
	part: true,
	normal: true,
	depth: true,
})

const backgroundAtom = atomWithReset<Vec4>(vec4.fromValues(0.4, 0.4, 0.4, 1))

const resetAtom = atom(null, (_, set) => {
	set(shadingModeAtom, RESET)
	set(cullingAtom, RESET)
	set(displayModeAtom, RESET)
	set(backgroundAtom, RESET)
})

export const renderingAtoms = {
	shadingModeAtom,
	cullingAtom,
	resetAtom,
	backgroundAtom,
	displayModeAtom,
	technicalConfigAtom,
}
