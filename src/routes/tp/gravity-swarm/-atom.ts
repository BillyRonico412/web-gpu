import { atom, getDefaultStore } from "jotai"

export const jotaiStore = getDefaultStore()
export const nbParticlesAtom = atom(5000)
