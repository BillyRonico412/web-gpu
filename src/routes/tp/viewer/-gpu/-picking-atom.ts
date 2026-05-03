import { produce } from "immer"
import { atom } from "jotai"
import { atomEffect } from "jotai-effect"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import {
	type PickParams,
	VisibilityState,
} from "@/routes/tp/viewer/-gpu/logic/-types"

const pickParamsAtom = atom<PickParams | undefined>()
const pickIdsAtom = atom<{
	current: Set<number>
	previous: Set<number>
}>({
	current: new Set<number>(),
	previous: new Set<number>(),
})

const mouseDownHandlerAtom = atom(null, (_, set, event: MouseEvent) => {
	if (event.button !== 0) {
		return
	}
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const rect = canvas.getBoundingClientRect()
	const x = event.clientX - rect.left
	const y = event.clientY - rect.top
	set(pickParamsAtom, { x, y, width: 1, height: 1 })
})

const mouseMoveHandlerAtom = atom(null, (_, set, event: MouseEvent) => {
	if (event.buttons !== 1) {
		return
	}
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const rect = canvas.getBoundingClientRect()
	const x = event.clientX - rect.left
	const y = event.clientY - rect.top
	set(
		pickParamsAtom,
		produce((draft) => {
			if (!draft) {
				return
			}
			const minX = Math.min(draft.x, x)
			const minY = Math.min(draft.y, y)
			const maxX = Math.max(draft.x, x)
			const maxY = Math.max(draft.y, y)
			draft.x = minX
			draft.y = minY
			draft.width = maxX - minX
			draft.height = maxY - minY
		}),
	)
})

const mouseUpHandlerAtom = atom(null, async (get, set, event: MouseEvent) => {
	if (event.button !== 0) {
		return
	}
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const pickParams = get(pickParamsAtom)
	if (!pickParams) {
		return
	}
	const partIdsPicked = await viewer.pickRect(pickParams)
	const newPickIds = new Set(partIdsPicked)
	if (!event.ctrlKey) {
		newPickIds.clear()
	}
	for (const id of partIdsPicked) {
		newPickIds.add(id)
	}
	set(pickIdsAtom, (prev) => ({
		current: newPickIds,
		previous: prev.current,
	}))
	set(pickParamsAtom, undefined)
})

const pickingEffect = atomEffect((get, set) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const pickIds = get(pickIdsAtom)
	viewer.partManager.updateVisibilityState(
		Array.from(pickIds.previous),
		VisibilityState.Highlighted,
		0,
	)
	viewer.partManager.updateVisibilityState(
		Array.from(pickIds.current),
		VisibilityState.Highlighted,
		VisibilityState.Highlighted,
	)
	set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
})

export const pickingAtoms = {
	pickParamsAtom,
	mouseDownHandlerAtom,
	mouseMoveHandlerAtom,
	mouseUpHandlerAtom,
	pickIdsAtom,
	pickingEffect,
}
