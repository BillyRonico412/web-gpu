import { atom } from "jotai"
import { vec3 } from "wgpu-matrix"

const lightDirectionAtom = atom(vec3.create(1, -2, -1))
const interpolateNormalsAtom = atom(true)

export const lightAtoms = { interpolateNormalsAtom, lightDirectionAtom }
