import { initWebGPU } from "@/lib/webgpu"
import shaderCode from "@/routes/_with-sidebar/texture/texture-1/-shader.wgsl?raw"

export const run = async () => {
	const { device } = await initWebGPU()

	const canvas = document.querySelector("#texture-1-canvas") as
		| HTMLCanvasElement
		| undefined
	if (!canvas) {
		throw new Error("No canvas")
	}
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("No context webgpu")
	}

	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		format: canvasFormat,
		device,
	})

	const pixelData = new Uint8Array([
		255, 0, 0, 255,

		0, 255, 0, 255,

		0, 0, 255, 255,

		255, 255, 0, 255,
	])

	const texture = device.createTexture({
		size: [2, 2],
		format: "rgba8unorm",
		usage:
			GPUTextureUsage.TEXTURE_BINDING | // Pour être lu par un shader
			GPUTextureUsage.COPY_DST, // Pour recevoir des données
	})

	device.queue.writeTexture(
		{
			texture,
		},
		pixelData,
		{ bytesPerRow: 8 }, // Mise en page: 8 octets par ligne 2 * 4
		{ width: 2, height: 2 }, // Quelle zone de la texture on remplit
	)

	const sampler = device.createSampler({
		magFilter: "nearest",
		minFilter: "nearest",
		addressModeU: "clamp-to-edge",
		addressModeV: "clamp-to-edge",
	})

	const bindGroupLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT, // On utilise que dans le fragment
				texture: {}, // C'est une texture
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT, // On utilise que dans le fragment
				sampler: {}, // C'est un sampler
			},
		],
	})

	const vertexData = new Float32Array([
		-1, 1,

		1, 1,

		1, -1,

		-1, -1,
	])

	const vertexBuffer = device.createBuffer({
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		size: vertexData.byteLength,
	})

	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	const indexData = new Uint32Array([0, 1, 2, 0, 3, 2])

	const indexBuffer = device.createBuffer({
		size: indexData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX,
	})

	device.queue.writeBuffer(indexBuffer, 0, indexData)

	const bingGroup = device.createBindGroup({
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: texture.createView({}),
			},
			{
				binding: 1,
				resource: sampler,
			},
		],
	})

	const shaderModule = device.createShaderModule({
		code: shaderCode,
	})
	const renderPipeline = device.createRenderPipeline({
		layout: device.createPipelineLayout({
			bindGroupLayouts: [bindGroupLayout],
		}),
		vertex: {
			module: shaderModule,
			entryPoint: "vs_main",
			buffers: [
				{
					arrayStride: 8,
					attributes: [
						{
							format: "float32x2",
							offset: 0,
							shaderLocation: 0,
						},
					],
				},
			],
		},
		fragment: {
			entryPoint: "fs_main",
			module: shaderModule,
			targets: [
				{
					format: canvasFormat,
				},
			],
		},
	})

	const encoder = device.createCommandEncoder()
	const textureView = context.getCurrentTexture()
	const renderPass = encoder.beginRenderPass({
		colorAttachments: [
			{
				loadOp: "clear",
				storeOp: "store",
				view: textureView,
			},
		],
	})
	renderPass.setPipeline(renderPipeline)
	renderPass.setVertexBuffer(0, vertexBuffer)
	renderPass.setIndexBuffer(indexBuffer, "uint32")
	renderPass.setBindGroup(0, bingGroup)
	renderPass.drawIndexed(indexData.length)
	renderPass.end()
	device.queue.submit([encoder.finish()])
}
