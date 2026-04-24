import { atom } from "jotai"

export type ShadingModeType = "flat" | "smooth"

const msaaAtom = atom(true)
const shadingModeAtom = atom<"flat" | "smooth">("smooth")
export const renderingAtoms = {
	msaaAtom,
	shadingModeAtom,
}
