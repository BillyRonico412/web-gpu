import { atom } from "jotai"
import type { GameOfLife } from "@/routes/tp/game-of-life/-wgpu"

export const generationTimeAtom = atom(100)
export const cellPixelDensityAtom = atom(8)
export const gameOfLifeAtom = atom<GameOfLife | undefined>(undefined)
export const isRunningAtom = atom(false)
export const timeAtom = atom(0)
