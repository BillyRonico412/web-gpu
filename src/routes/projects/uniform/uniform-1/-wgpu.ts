import { initWebGPU } from "@/lib/webgpu"
import shaderCode from "@/routes/projects/uniform/uniform-1/-shader.wgsl?raw"

export const init = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#uniform-canvas") as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("Error when get context")
	}
	const uniformData = new Float32Array(4)
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format: canvasFormat,
		alphaMode: "opaque",
		colorSpace: "srgb",
	})
	uniformData[0] = 0

	const uniformBuffer = device.createBuffer({
		label: "Uniform buffer",
		size: uniformData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
	})
	device.queue.writeBuffer(uniformBuffer, 0, uniformData)

	const shaderModule = device.createShaderModule({
		label: "Shader",
		code: shaderCode,
	})

	const pipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: {
			module: shaderModule,
			entryPoint: "vs_main",
		},
		fragment: {
			module: shaderModule,
			entryPoint: "fs_main",
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

	const bindGroup = device.createBindGroup({
		label: "Bind group uniform",
		layout: pipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: uniformBuffer,
				},
			},
		],
	})
	return (speed: number) => {
		uniformData[0] += 1 * speed
		device.queue.writeBuffer(uniformBuffer, 0, uniformData)
		const encoder = device.createCommandEncoder({
			label: "Encoder",
		})
		const textureView = context.getCurrentTexture()
		const renderPass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					storeOp: "store",
					loadOp: "clear",
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
		renderPass.setBindGroup(0, bindGroup)
		renderPass.draw(3)
		renderPass.end()
		device.queue.submit([encoder.finish()])
	}
}
