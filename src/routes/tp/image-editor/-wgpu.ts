import { initWebGPU } from "@/lib/webgpu"

export const CANVAS_ID = "image-editor-canvas"

export const initImageEditor = async () => {
	const { device } = await initWebGPU()
	const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("WebGPU not supported on this browser.")
	}
	const format = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format,
		alphaMode: "premultiplied",
	})
}
