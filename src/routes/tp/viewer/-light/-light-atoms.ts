import { atom } from "jotai"
import { atomEffect } from "jotai-effect"
import { vec3 } from "wgpu-matrix"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"

const interpolateNormalsAtom = atom(true)
const lightModeAtom = atom<"headlight" | "directional">("headlight")
const lightDirectionAtom = atom(vec3.create(1, -2, -1))

const lightModeEffect = atomEffect((get, set) => {
	const mode = get(lightModeAtom)
	const viewMatrix = get(cameraAtoms.viewMatrixAtom)
	const viewDirection = vec3.fromValues(
		-viewMatrix[2],
		-viewMatrix[6],
		-viewMatrix[10],
	)
	switch (mode) {
		case "directional":
			return
		case "headlight":
			set(lightDirectionAtom, vec3.normalize(viewDirection))
			return
	}
})

export const lightAtoms = {
	interpolateNormalsAtom,
	lightDirectionAtom,
	lightModeAtom,
	lightModeEffect,
}
