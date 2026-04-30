import type { MsTexView, TexView } from "@/routes/tp/viewer/-gpu/logic/-types"

const createMsTexView = (
	device: GPUDevice,
	canvas: HTMLCanvasElement,
	format: GPUTextureFormat,
): MsTexView => {
	const baseTexture = device.createTexture({
		label: "Base texture",
		size: [canvas.width, canvas.height],
		format,
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
	})
	const msTexture = device.createTexture({
		label: "MS texture",
		size: [canvas.width, canvas.height],
		format,
		sampleCount: 4,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})
	return {
		base: {
			texture: baseTexture,
			view: baseTexture.createView(),
		},
		ms: {
			texture: msTexture,
			view: msTexture.createView(),
		},
	}
}

export const createRenderResources = (device: GPUDevice) => {
	const createRenderDepthTexture = (canvas: HTMLCanvasElement): TexView => {
		const depthTexture = device.createTexture({
			label: "Depth texture",
			size: [canvas.width, canvas.height],
			format: "depth24plus",
			sampleCount: 4,
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: depthTexture,
			view: depthTexture.createView(),
		}
	}

	const createColorTexture = (params: {
		canvas: HTMLCanvasElement
	}): MsTexView => {
		return createMsTexView(
			device,
			params.canvas,
			navigator.gpu.getPreferredCanvasFormat(),
		)
	}

	const createNormalTexture = (params: {
		canvas: HTMLCanvasElement
	}): MsTexView => {
		return createMsTexView(device, params.canvas, "rgba16float")
	}

	const createGeometryIdTexture = (params: {
		canvas: HTMLCanvasElement
	}): TexView => {
		const geometryIdTexture = device.createTexture({
			label: "Geometry ID texture",
			size: [params.canvas.width, params.canvas.height],
			format: "r32float",
			sampleCount: 4,
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: geometryIdTexture,
			view: geometryIdTexture.createView(),
		}
	}

	return {
		createRenderDepthTexture,
		createColorTexture,
		createGeometryIdTexture,
		createNormalTexture,
	}
}
