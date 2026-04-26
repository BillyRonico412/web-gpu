import { atom } from "jotai"
import { atomEffect } from "jotai-effect"
import { type Vec3, vec3 } from "wgpu-matrix"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"

export type LightModeType = "headlight" | "directional"

export const LIGHT_DEFAULTS = {
	lightMode: "headlight" as LightModeType,
	ambient: 0.15,
	specularIntensity: 0.3,
	specularEnabled: true,
}

const lightModeAtom = atom<LightModeType>(LIGHT_DEFAULTS.lightMode)
const lightDirectionAtom = atom<Vec3>(vec3.create(1, -2, -1))
const ambientAtom = atom<number>(LIGHT_DEFAULTS.ambient)
const specularIntensityAtom = atom<number>(LIGHT_DEFAULTS.specularIntensity)
const specularEnabledAtom = atom<boolean>(LIGHT_DEFAULTS.specularEnabled)

const resetAtom = atom(null, (_, set) => {
	set(lightModeAtom, LIGHT_DEFAULTS.lightMode)
	set(ambientAtom, LIGHT_DEFAULTS.ambient)
	set(specularIntensityAtom, LIGHT_DEFAULTS.specularIntensity)
	set(specularEnabledAtom, LIGHT_DEFAULTS.specularEnabled)
})

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
	lightDirectionAtom,
	lightModeAtom,
	lightModeEffect,
	ambientAtom,
	specularIntensityAtom,
	specularEnabledAtom,
	resetAtom,
}
