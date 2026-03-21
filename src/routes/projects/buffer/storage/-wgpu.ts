import { initWebGPU } from "@/lib/webgpu"
import shaderCode from "@/routes/projects/buffer/storage/-shader.wgsl?raw"

const rand = (x: number, y: number) => {
	return Math.random() * (y - x) + x
}

export const run = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#uniform-canvas") as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("Error when get context")
	}

	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format: canvasFormat,
	})

	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: shaderCode,
	})

	const pipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: {
			module: shaderModule,
			entryPoint: "vs_main",
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
		primitive: {
			topology: "triangle-list",
		},
	})

	const textureView = context.getCurrentTexture()
	const encoder = device.createCommandEncoder()
	const renderPass = encoder.beginRenderPass({
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

	const uniformBufferSize = 8 + 4 + 4 + 12
	const positionOffset = 0
	const scaleOffset = 2
	const colorOffset = 4

	for (let i = 0; i < 100; i++) {
		const uniformData = new Float32Array(uniformBufferSize)
		uniformData.set([rand(-0.8, 0.8), rand(-0.8, 0.8)], positionOffset)
		uniformData.set([rand(0.5, 2)], scaleOffset)
		uniformData.set([rand(0, 1), rand(0, 1), rand(0, 1)], colorOffset)
		const buffer = device.createBuffer({
			size: uniformData.byteLength,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
		})
		device.queue.writeBuffer(buffer, 0, uniformData)
		const bindGroup = device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: {
						buffer,
					},
				},
			],
		})
		renderPass.setBindGroup(0, bindGroup)
		renderPass.draw(3)
	}
	renderPass.end()
	device.queue.submit([encoder.finish()])
}
