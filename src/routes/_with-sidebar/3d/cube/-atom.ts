import { atom } from "jotai"
import type { Cube } from "@/routes/_with-sidebar/3d/cube/-wgpu"

export const angleRotateXAtom = atom<number>(30)
export const angleRotateYAtom = atom<number>(60)
export const angleRotateZAtom = atom<number>(90)
export const distanceCameraAtom = atom<number>(10)
export const fovAngleAtom = atom<number>(45)
export const cubeAtom = atom<Cube | undefined>()
