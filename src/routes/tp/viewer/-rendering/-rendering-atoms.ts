import { atom } from "jotai"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"

const msaaAtom = atom(true)
const shadingModeAtom = atom<ShadingModeType>("auto")
const cullingAtom = atom(true)
export const renderingAtoms = {
	msaaAtom,
	shadingModeAtom,
	cullingAtom,
}
