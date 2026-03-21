import { initWebGPU } from "@/lib/webgpu"
import shaderCode from "@/routes/projects/buffer/vertex/-shader.wgsl?raw"

export const run = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#vertex-canvas") as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("Error when get context")
	}
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format: canvasFormat,
		alphaMode: "opaque",
		colorSpace: "srgb",
	})
	const vertexData = new Float32Array([
		// P1
		-0.5, 0,
		// P2
		0, 0.5,
		// P3
		0, -0.5,
		// P4
		0.5, 0,
	])
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: vertexData.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	const indexData = new Uint16Array([0, 1, 2, 1, 2, 3])
	const indexBuffer = device.createBuffer({
		label: "Index buffer",
		size: indexData.byteLength,
		usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(indexBuffer, 0, indexData)

	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: shaderCode,
	})

	const pipeline = device.createRenderPipeline({
		label: "Pipeline",
		layout: "auto",
		vertex: {
			module: shaderModule,
			buffers: [
				{
					arrayStride: 8,
					attributes: [
						{
							format: "float32x2",
							shaderLocation: 0,
							offset: 0,
						},
					],
					stepMode: "vertex",
				},
			],
			entryPoint: "vs_main",
		},
		fragment: {
			module: shaderModule,
			targets: [
				{
					format: canvasFormat,
				},
			],
			entryPoint: "fs_main",
		},
	})

	const encoder = device.createCommandEncoder({
		label: "Encoder",
	})

	const textureView = context.getCurrentTexture().createView()
	const renderPass = encoder.beginRenderPass({
		label: "Render pass",
		colorAttachments: [
			{
				loadOp: "clear",
				storeOp: "store",
				view: textureView,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1,
				},
			},
		],
	})
	renderPass.setPipeline(pipeline)
	renderPass.setVertexBuffer(0, vertexBuffer)
	renderPass.setIndexBuffer(indexBuffer, "uint16")
	renderPass.drawIndexed(indexData.length)
	renderPass.end()
	device.queue.submit([encoder.finish()])
}
