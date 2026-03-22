import { initWebGPU } from "@/lib/webgpu"
import shaderSource1 from "@/routes/_with-sidebar/multi-stage-variable/-shader.wgsl?raw"

export const run = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#multi-stage-variable-canvas") as
		| HTMLCanvasElement
		| undefined

	if (!canvas) {
		throw new Error("Canvas not found")
	}

	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("Canvas context not found")
	}
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format: canvasFormat,
		alphaMode: "opaque",
		colorSpace: "srgb",
	})

	const offsetData = new Float32Array([0.5, -0.2])
	const uniformBuffer = device.createBuffer({
		size: offsetData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
	})
	device.queue.writeBuffer(uniformBuffer, 0, offsetData)

	const shaderModule = device.createShaderModule({
		label: "Shader",
		code: shaderSource1,
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
			targets: [{ format: canvasFormat }],
		},
		primitive: {
			topology: "triangle-list",
		},
	})

	const commandEncoder = device.createCommandEncoder()
	const textureView = context.getCurrentTexture().createView()
	// Début du pass de rendu
	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: textureView, // Ou déssiner
				clearValue: { r: 0, g: 0, b: 0, a: 1 }, // Couleur de fond
				loadOp: "clear", // Effacé avant de déssiner
				storeOp: "store", // Garde le résultat après le dessin
			},
		],
	})

	renderPass.setPipeline(pipeline) // Utilisation du pipeline
	renderPass.draw(3) // Appele le vertex shader 3 fois
	renderPass.end()
	device.queue.submit([commandEncoder.finish()])
}
