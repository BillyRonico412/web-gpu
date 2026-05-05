import { produce } from "immer"
import { atom } from "jotai"
import { atomEffect } from "jotai-effect"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import {
	type PickParams,
	VisibilityState,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const RUBBER_BAND_ID = "rubber-band"

let mouseUpTimer: number | undefined

const rectAtom = atom<
	{ x1: number; y1: number; x2: number; y2: number } | undefined
>(undefined)
const pickParamsAtom = atom<PickParams | undefined>((get) => {
	const rect = get(rectAtom)
	if (!rect) {
		return undefined
	}
	const x = Math.min(rect.x1, rect.x2)
	const y = Math.min(rect.y1, rect.y2)
	const width = Math.abs(rect.x2 - rect.x1)
	const height = Math.abs(rect.y2 - rect.y1)
	return { x, y, width, height }
})

const pickIdsAtom = atom<Set<number>>(new Set<number>())
const deletedIdsAtom = atom<Set<number>>(new Set<number>())

const updatePickIdsAtom = atom(null, (get, set, partIds: Set<number>) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const pickIds = get(pickIdsAtom)
	const newPickIds = new Set(partIds)
	const offIds = pickIds.difference(newPickIds)
	const onIds = newPickIds.difference(pickIds)
	viewer.partManager.updateVisibilityState(
		Array.from(offIds),
		VisibilityState.Highlighted,
		0,
	)
	viewer.partManager.updateVisibilityState(
		Array.from(onIds),
		VisibilityState.Highlighted,
		VisibilityState.Highlighted,
	)
	set(pickIdsAtom, newPickIds)
	set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
})

const deleteIdsAtom = atom(null, (get, set) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const pickIds = get(pickIdsAtom)
	viewer.partManager.updateVisibilityState(
		Array.from(pickIds),
		VisibilityState.Hidden,
		VisibilityState.Hidden,
	)
	set(deletedIdsAtom, (prev) => prev.union(pickIds))
	set(pickIdsAtom, new Set<number>())
	set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
})

const restoreDeletedIdsAtom = atom(null, (get, set) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const deletedIds = get(deletedIdsAtom)
	viewer.partManager.updateVisibilityState(
		Array.from(deletedIds),
		VisibilityState.Hidden,
		0,
	)
	set(deletedIdsAtom, new Set<number>())
	set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
})

const mouseDownHandlerAtom = atom(null, (_, set, event: MouseEvent) => {
	if (event.button !== 0) {
		return
	}
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const rect = canvas.getBoundingClientRect()
	const x = event.clientX - rect.left
	const y = event.clientY - rect.top
	set(rectAtom, { x1: x, y1: y, x2: x + 1, y2: y + 1 })
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
		rectAtom,
		produce((draft) => {
			if (!draft) {
				draft = { x1: x, y1: y, x2: x, y2: y }
			} else {
				draft.x2 = x
				draft.y2 = y
			}
		}),
	)
})

const mouseUpHandlerAtom = atom(null, async (_, set, event: MouseEvent) => {
	if (event.button !== 0) {
		return
	}
	if (mouseUpTimer) {
		window.clearTimeout(mouseUpTimer)
		mouseUpTimer = undefined
		set(dbClickHandlerAtom, event)
		return
	}
	mouseUpTimer = window.setTimeout(() => {
		set(clickHandlerAtom, event)
		mouseUpTimer = undefined
	}, 200)
})

const clickHandlerAtom = atom(null, async (get, set, event: MouseEvent) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const pickParams = get(pickParamsAtom)
	if (!pickParams) {
		return
	}
	const partIdsPicked = await viewer.pickRect(pickParams)
	const pickIds = get(pickIdsAtom)
	const newPickIds = new Set(pickIds)
	if (!event.ctrlKey) {
		newPickIds.clear()
	}
	for (const id of partIdsPicked) {
		newPickIds.add(id)
	}
	set(updatePickIdsAtom, newPickIds)
	set(rectAtom, undefined)
})

const dbClickHandlerAtom = atom(null, async (get, set, event: MouseEvent) => {
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const rect = canvas.getBoundingClientRect()
	const x = event.clientX - rect.left
	const y = event.clientY - rect.top
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const partIds = await viewer.pickRect({ x, y, width: 1, height: 1 })
	if (partIds.length === 0) {
		return
	}
	const partInfo = viewer.partManager.getPartInfo(partIds[0])
	set(cameraAtoms.fitToAabbAtom, partInfo.aabb)
})

const rubberBandEffect = atomEffect((get) => {
	const pickParams = get(pickParamsAtom)
	const rubberBandDiv = document.querySelector(
		`#${RUBBER_BAND_ID}`,
	) as HTMLDivElement
	if (!pickParams || pickParams.width < 5 || pickParams.height < 5) {
		rubberBandDiv.style.display = "none"
		rubberBandDiv.style.width = "0px"
		rubberBandDiv.style.height = "0px"
		rubberBandDiv.style.left = "0px"
		rubberBandDiv.style.top = "0px"
		return
	}
	rubberBandDiv.style.display = "block"
	rubberBandDiv.style.width = `${pickParams.width}px`
	rubberBandDiv.style.height = `${pickParams.height}px`
	rubberBandDiv.style.left = `${pickParams.x}px`
	rubberBandDiv.style.top = `${pickParams.y}px`
})

const deleteEffect = atomEffect((get, set) => {
	const pickIds = get(pickIdsAtom)
	if (pickIds.size === 0) {
		return
	}
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const handler = (e: KeyboardEvent) => {
		if (e.key === "Delete") {
			set(deleteIdsAtom)
		}
		if (e.key === "Escape") {
			set(restoreDeletedIdsAtom)
		}
	}
	window.addEventListener("keydown", handler)
	return () => {
		window.removeEventListener("keydown", handler)
	}
})

export const pickingAtoms = {
	pickParamsAtom,
	mouseDownHandlerAtom,
	mouseMoveHandlerAtom,
	mouseUpHandlerAtom,
	pickIdsAtom,
	rubberBandEffect,
	deleteEffect,
}
