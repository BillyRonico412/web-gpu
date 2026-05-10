import { initWebGPU } from "@/lib/webgpu"
import { createRenderManager } from "@/routes/tp/image-editor/-render-manager"
import type { AppliedFilter } from "@/routes/tp/image-editor/-types"

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

	const { createSampler, createTextureFromImage, doRenderPass } =
		createRenderManager(device, context)

	let texture: GPUTexture | undefined
	let sampler: GPUSampler | undefined

	const render = (params: { appliedFilter: AppliedFilter }) => {
		const { appliedFilter } = params
		if (!texture || !sampler) {
			return
		}
		const commandEncoder = device.createCommandEncoder()
		const textureView = texture.createView()
		doRenderPass({
			commandEncoder,
			textureView,
			sampler,
			appliedFilter,
			canvas,
		})
		device.queue.submit([commandEncoder.finish()])
	}

	const loadImage = async (url: string) => {
		texture = await createTextureFromImage(url)
		sampler = createSampler()
	}

	const cleanup = () => {
		texture?.destroy()
	}

	return {
		loadImage,
		render,
		cleanup,
	}
}

export type ImageEditor = Awaited<ReturnType<typeof initImageEditor>>
