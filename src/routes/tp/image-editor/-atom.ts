import { atom } from "jotai"
import { atomEffect } from "jotai-effect"
import { AppliedFilter } from "@/routes/tp/image-editor/-types"
import {
	CANVAS_ID,
	type ImageEditor,
	initImageEditor,
} from "@/routes/tp/image-editor/-wgpu"

const imageUrlAtom = atom("/rachel.jpg")
const imageEditorAtom = atom<ImageEditor | undefined>(undefined)

const appliedFilterAtom = atom<AppliedFilter>(AppliedFilter.None)

const initImageEditorEffect = atomEffect((get, set) => {
	void (async () => {
		const imageEditor = await initImageEditor()
		set(imageEditorAtom, imageEditor)
	})()
	return () => {
		const imageEditor = get(imageEditorAtom)
		if (imageEditor) {
			imageEditor.cleanup()
		}
	}
})

const loadImageEffect = atomEffect((get, set) => {
	const imageEditor = get(imageEditorAtom)
	if (!imageEditor) {
		return
	}
	const url = get(imageUrlAtom)
	;(async () => {
		await imageEditor.loadImage(url)
		set(renderTriggerAtom, (prev) => prev + 1)
	})()
})

const resizeEffect = atomEffect((get, set) => {
	const imageEditor = get(imageEditorAtom)
	if (!imageEditor) {
		return
	}
	const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement
	const handleResize = () => {
		const dpr = window.devicePixelRatio || 1
		canvas.width = canvas.clientWidth * dpr
		canvas.height = canvas.clientHeight * dpr
		set(renderTriggerAtom, (prev) => prev + 1)
	}
	handleResize()
	window.addEventListener("resize", handleResize)
	return () => {
		window.removeEventListener("resize", handleResize)
	}
})

const renderTriggerAtom = atom(0)

const renderEffect = atomEffect((get) => {
	const imageEditor = get(imageEditorAtom)
	if (!imageEditor) {
		return
	}
	get(renderTriggerAtom) // subscribe to trigger
	const appliedFilter = get(appliedFilterAtom)
	imageEditor.render({ appliedFilter })
})

export const atoms = {
	imageUrlAtom,
	imageEditorAtom,
	initImageEditorEffect,
	loadImageEffect,
	resizeEffect,
	appliedFilterAtom,
	renderTriggerAtom,
	renderEffect,
}
