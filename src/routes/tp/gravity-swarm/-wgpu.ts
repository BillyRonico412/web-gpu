import { initWebGPU } from "@/lib/webgpu"
import { jotaiStore, uniformAtom } from "@/routes/tp/gravity-swarm/-atom"
import computeShaderCode from "@/routes/tp/gravity-swarm/-compute-shader.wgsl?raw"
import renderShaderCode from "@/routes/tp/gravity-swarm/-render-shader.wgsl?raw"

const NB_PARTICLE = 1000
const NB_PARTICLE_DIVISION = 6
const rand = (min: number, max: number) => {
	return Math.random() * (max - min) + min
}

export type UpdateUniformDataParams = {
	canvas: HTMLCanvasElement
	clickPosition: [number, number]
	clickState: ClickState
}

export enum ClickState {
	None = 0,
	Left = 1,
	Right = 2,
}

export const resizeCanvas = () => {
	const canvas = document.querySelector(
		"#gravity-swarm-canvas",
	) as HTMLCanvasElement
	if (!canvas) {
		return
	}
	const dpr = window.devicePixelRatio || 1
	const width = canvas.clientWidth * dpr
	const height = canvas.clientHeight * dpr
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width
		canvas.height = height
	}
}

const getVertexElement = (device: GPUDevice) => {
	// Vertex buffer
	const vertexData = new Float32Array((1 + NB_PARTICLE_DIVISION) * 2)
	vertexData.set([0, 0], 0)
	const offsetAngle = (Math.PI * 2) / NB_PARTICLE_DIVISION
	for (let i = 0; i < NB_PARTICLE_DIVISION; i++) {
		vertexData.set(
			[Math.cos(offsetAngle * i), Math.sin(offsetAngle * i)],
			(i + 1) * 2,
		)
	}
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		size: vertexData.byteLength,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)
	return { vertexData, vertexBuffer }
}

const getIndexElement = (device: GPUDevice) => {
	// Index buffer
	const indexData = new Uint32Array((NB_PARTICLE_DIVISION + 1) * 3)
	for (let i = 0; i < NB_PARTICLE_DIVISION; i++) {
		indexData.set([0, i + 1, i + 2], i * 3)
	}
	indexData.set([0, NB_PARTICLE_DIVISION, 1], NB_PARTICLE_DIVISION * 3)
	const indexBuffer = device.createBuffer({
		label: "Index buffer",
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX,
		size: indexData.byteLength,
	})
	device.queue.writeBuffer(indexBuffer, 0, indexData)
	return { indexBuffer, indexData }
}

const getUniformElement = (device: GPUDevice) => {
	// Canvas size buffer
	// 2 float for canvas size, 2 for click position, 1 for click state
	const uniformDataSize = 2 + 2 + 2
	const uniformDataOffset = {
		canvasSize: 0,
		clickPosition: 2,
		clickState: 4,
	}
	const uniformData = new Float32Array(uniformDataSize)
	const uniformBuffer = device.createBuffer({
		label: "Canvas size uniform buffer",
		size: uniformData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
	})
	device.queue.writeBuffer(uniformBuffer, 0, uniformData)
	const uniformBindGroupLayout = device.createBindGroupLayout({
		label: "Canvas bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
				buffer: { type: "uniform" },
			},
		],
	})
	const uniformBindGroup = device.createBindGroup({
		label: "Canvas bing group",
		layout: uniformBindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: uniformBuffer,
			},
		],
	})

	const updateUniformData = (params: UpdateUniformDataParams) => {
		const { canvas, clickPosition, clickState } = params
		uniformData.set([canvas.width, canvas.height], uniformDataOffset.canvasSize)
		uniformData.set(clickPosition, uniformDataOffset.clickPosition)
		uniformData.set([clickState], uniformDataOffset.clickState)
		device.queue.writeBuffer(uniformBuffer, 0, uniformData)
	}

	return {
		uniformData,
		uniformBuffer,
		uniformBindGroupLayout,
		uniformBindGroup,
		uniformDataOffset,
		updateUniformData,
	}
}

const getParticleElement = (device: GPUDevice, canvas: HTMLCanvasElement) => {
	// 5 [float, float] for position, [float, float] for speed, [float, float, float] for color, 1 float for weight
	const particleDataSize = 2 + 2 + 3 + 1
	const particleDataOffset = {
		position: 0,
		speed: 2,
		color: 4,
		weight: 7,
	}
	const particleData = new Float32Array(particleDataSize * NB_PARTICLE)
	for (let i = 0; i < NB_PARTICLE; i++) {
		const startOffset = i * particleDataSize
		particleData.set(
			[Math.floor(rand(0, canvas.width)), Math.floor(rand(0, canvas.height))],
			startOffset + particleDataOffset.position,
		)
		particleData.set([0, 0], startOffset + particleDataOffset.speed)
		particleData.set(
			[rand(0.2, 1), rand(0.2, 1), rand(0.2, 1)],
			startOffset + particleDataOffset.color,
		)
		particleData.set([rand(2, 5)], startOffset + particleDataOffset.weight)
	}
	const particleBuffer = device.createBuffer({
		label: "Particle buffer",
		size: particleData.byteLength,
		usage:
			GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
	})
	device.queue.writeBuffer(particleBuffer, 0, particleData)
	const particleComputeBingGroupLayout = device.createBindGroupLayout({
		label: "Compute particles layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
		],
	})
	const particleComputeBindGroup = device.createBindGroup({
		label: "Particle bind group",
		layout: particleComputeBingGroupLayout,
		entries: [
			{
				binding: 0,
				resource: particleBuffer,
			},
		],
	})
	const particleRenderBindGroupLayout = device.createBindGroupLayout({
		label: "Render particles layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: { type: "read-only-storage" },
			},
		],
	})
	const particleRenderBindGroup = device.createBindGroup({
		label: "Render particle bind group",
		layout: particleRenderBindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: particleBuffer,
			},
		],
	})
	return {
		particleData,
		particleBuffer,
		particleComputeBingGroupLayout,
		particleComputeBindGroup,
		particleRenderBindGroupLayout,
		particleRenderBindGroup,
	}
}

const getComputePipeline = (params: {
	device: GPUDevice
	uniformBindGroupLayout: GPUBindGroupLayout
	particleComputeBingGroupLayout: GPUBindGroupLayout
}) => {
	const { device, uniformBindGroupLayout, particleComputeBingGroupLayout } =
		params
	const computeShaderModule = device.createShaderModule({
		label: "Compute shader",
		code: computeShaderCode,
	})

	const computePipeline = device.createComputePipeline({
		label: "Compute pipeline",
		layout: device.createPipelineLayout({
			bindGroupLayouts: [
				uniformBindGroupLayout,
				particleComputeBingGroupLayout,
			],
		}),
		compute: {
			module: computeShaderModule,
			entryPoint: "cs_main",
		},
	})
	return computePipeline
}

const getRenderPipeline = (params: {
	device: GPUDevice
	uniformBindGroupLayout: GPUBindGroupLayout
	particleRenderBindGroupLayout: GPUBindGroupLayout
	canvasFormat: GPUTextureFormat
}) => {
	const {
		device,
		uniformBindGroupLayout,
		particleRenderBindGroupLayout,
		canvasFormat,
	} = params
	const renderShaderModule = device.createShaderModule({
		label: "Render shader",
		code: renderShaderCode,
	})
	const renderPipeline = device.createRenderPipeline({
		label: "Pipeline",
		layout: device.createPipelineLayout({
			bindGroupLayouts: [uniformBindGroupLayout, particleRenderBindGroupLayout],
		}),
		vertex: {
			module: renderShaderModule,
			entryPoint: "vs_main",
			buffers: [
				{
					arrayStride: 2 * 4,
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
			module: renderShaderModule,
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
	return renderPipeline
}

export const initGravitySwarm = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#gravity-swarm-canvas") as
		| HTMLCanvasElement
		| undefined
	if (!canvas) {
		throw new Error("No canvas")
	}
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("Error when get context")
	}
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		format: canvasFormat,
		device,
		alphaMode: "opaque",
	})

	const { vertexBuffer } = getVertexElement(device)
	const { indexBuffer, indexData } = getIndexElement(device)
	const { uniformBindGroupLayout, uniformBindGroup, updateUniformData } =
		getUniformElement(device)
	const {
		particleComputeBingGroupLayout,
		particleComputeBindGroup,
		particleRenderBindGroupLayout,
		particleRenderBindGroup,
	} = getParticleElement(device, canvas)

	const computePipeline = getComputePipeline({
		device,
		uniformBindGroupLayout,
		particleComputeBingGroupLayout,
	})

	const renderPipeline = getRenderPipeline({
		device,
		uniformBindGroupLayout,
		particleRenderBindGroupLayout,
		canvasFormat,
	})

	const draw = () => {
		const newUniformData = jotaiStore.get(uniformAtom)
		updateUniformData({
			...newUniformData,
			canvas,
		})

		const encoder = device.createCommandEncoder()
		const computePass = encoder.beginComputePass({
			label: "Compute pass",
		})
		computePass.setPipeline(computePipeline)
		computePass.setBindGroup(0, uniformBindGroup)
		computePass.setBindGroup(1, particleComputeBindGroup)

		computePass.dispatchWorkgroups(NB_PARTICLE / 64 + 1)
		computePass.end()

		const textureView = context.getCurrentTexture()
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

		renderPass.setPipeline(renderPipeline)

		renderPass.setVertexBuffer(0, vertexBuffer)
		renderPass.setIndexBuffer(indexBuffer, "uint32")

		renderPass.setBindGroup(0, uniformBindGroup)
		renderPass.setBindGroup(1, particleRenderBindGroup)

		renderPass.drawIndexed(indexData.length, NB_PARTICLE)
		renderPass.end()
		device.queue.submit([encoder.finish()])
	}
	return { draw }
}
