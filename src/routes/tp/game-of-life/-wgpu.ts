import { themeAtom } from "@/components/theme-provider"
import { initWebGPU } from "@/lib/webgpu"
import { cellPixelDensityAtom, timeAtom } from "@/routes/tp/game-of-life/-atom"
import {
	insertStructureToGrid,
	type StructureType,
} from "@/routes/tp/game-of-life/-structures/-structures"
import computeShaderCode from "@/routes/tp/game-of-life/shaders/-compute-shader.wgsl?raw"
import renderShaderCode from "@/routes/tp/game-of-life/shaders/-render-shader.wgsl?raw"
import { jotaiStore } from "@/routes/tp/gravity-swarm/-atom"

export const drawLines = () => {
	const canvas = document.querySelector("#grid") as HTMLCanvasElement
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
	const ctx = canvas.getContext("2d")
	if (!ctx) {
		return
	}
	const cellPixelDensity = jotaiStore.get(cellPixelDensityAtom)
	ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(
		"--color-foreground",
	)
	ctx.lineWidth = 0.2
	ctx.clearRect(0, 0, width, height)
	for (let x = 0; x < width; x += cellPixelDensity) {
		ctx.beginPath()
		ctx.moveTo(x, 0)
		ctx.lineTo(x, height)
		ctx.stroke()
	}
	for (let y = 0; y < height; y += cellPixelDensity) {
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo(width, y)
		ctx.stroke()
	}
}

export const resizeCanvas = () => {
	const canvas = document.querySelector("#game-of-life") as HTMLCanvasElement
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

let storage:
	| {
			storageBuffer1: GPUBuffer
			storageBuffer2: GPUBuffer
			stagingBuffer1: GPUBuffer
			stagingBuffer2: GPUBuffer
			cellWidth: number
			cellHeight: number
	  }
	| undefined

const resetStorages = (device: GPUDevice, canvas: HTMLCanvasElement) => {
	if (storage) {
		storage.storageBuffer1.destroy()
		storage.storageBuffer2.destroy()
		storage.stagingBuffer1.destroy()
		storage.stagingBuffer2.destroy()
	}
	const cellPixelDensity = jotaiStore.get(cellPixelDensityAtom)
	const cellWidth = Math.floor(canvas.width / cellPixelDensity)
	const cellHeight = Math.floor(canvas.height / cellPixelDensity)
	const [storageBuffer1, storageBuffer2] = [1, 2].map((i) =>
		device.createBuffer({
			label: `Storage buffer ${i} ${crypto.randomUUID()}`,
			size: cellWidth * cellHeight * 4,
			usage:
				GPUBufferUsage.STORAGE |
				GPUBufferUsage.COPY_DST |
				GPUBufferUsage.COPY_SRC,
		}),
	)
	const [stagingBuffer1, stagingBuffer2] = [1, 2].map((i) =>
		device.createBuffer({
			label: `Staging buffer ${i} ${crypto.randomUUID()}`,
			size: cellWidth * cellHeight * 4,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
		}),
	)
	const storageData = new Uint32Array(cellWidth * cellHeight)
	for (let i = 0; i < cellHeight; i++) {
		const lineOffset = i * cellWidth
		for (let j = 0; j < cellWidth; j++) {
			const colOffset = lineOffset + j
			storageData.set([0], colOffset)
		}
	}
	;[storageBuffer1, storageBuffer2, stagingBuffer1, stagingBuffer2].forEach(
		(storageBuffer) => {
			device.queue.writeBuffer(storageBuffer, 0, storageData)
		},
	)

	storage = {
		storageBuffer1,
		storageBuffer2,
		stagingBuffer1,
		stagingBuffer2,
		cellWidth,
		cellHeight,
	}
}

const updateStorageByStructure = (
	device: GPUDevice,
	structure: StructureType,
) => {
	if (!storage) {
		throw new Error("Storage not initialized")
	}
	const { storageBuffer1, storageBuffer2, cellWidth, cellHeight } = storage
	const storageData = new Uint32Array(cellWidth * cellHeight)
	for (let i = 0; i < cellHeight; i++) {
		const lineOffset = i * cellWidth
		for (let j = 0; j < cellWidth; j++) {
			const colOffset = lineOffset + j
			storageData.set([0], colOffset)
		}
	}
	insertStructureToGrid(structure, storageData, cellWidth, cellHeight)
	;[storageBuffer1, storageBuffer2].forEach((storageBuffer) => {
		device.queue.writeBuffer(storageBuffer, 0, storageData)
	})
}

const getComputePipeline = (device: GPUDevice) => {
	const computeUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Compute Uniform",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "uniform",
				},
			},
		],
	})
	const createComputeUniformBindGroup = (uniformBuffer: GPUBuffer) => {
		return device.createBindGroup({
			layout: computeUniformBindGroupLayout,
			label: "Compute Uniform bind group",
			entries: [
				{
					binding: 0,
					resource: {
						buffer: uniformBuffer,
					},
				},
			],
		})
	}
	const computeStorageBindGroupLayout = device.createBindGroupLayout({
		label: "Compute storage bind group layout",
		entries: [
			// Storage 1
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "storage",
				},
			},
			// Storage 2
			{
				binding: 1,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "storage",
				},
			},
		],
	})
	const createComputeStorageBindGroup = (
		storageBuffer1: GPUBuffer,
		storageBuffer2: GPUBuffer,
	) => {
		return device.createBindGroup({
			layout: computeStorageBindGroupLayout,
			label: "Compute storages bind group",
			entries: [
				{
					binding: 0,
					resource: storageBuffer1,
				},
				{
					binding: 1,
					resource: storageBuffer2,
				},
			],
		})
	}

	const computePipeline = device.createComputePipeline({
		label: "Compute pipeline",
		compute: {
			entryPoint: "cs_main",
			module: device.createShaderModule({
				label: "Compute shader module",
				code: computeShaderCode,
			}),
		},
		layout: device.createPipelineLayout({
			bindGroupLayouts: [
				computeUniformBindGroupLayout,
				computeStorageBindGroupLayout,
			],
		}),
	})
	return {
		computePipeline,
		createComputeStorageBindGroup,
		createComputeUniformBindGroup,
	}
}

const getRenderPipeline = (device: GPUDevice) => {
	const renderUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Render uniform bing group layout",
		entries: [
			// Uniform buffer
			{
				binding: 0,
				buffer: {
					type: "uniform",
				},
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
			},
		],
	})
	const createRenderUniformBindGroup = (uniformBuffer: GPUBuffer) => {
		return device.createBindGroup({
			layout: renderUniformBindGroupLayout,
			label: "Render uniform bind group",
			entries: [
				{
					binding: 0,
					resource: {
						buffer: uniformBuffer,
					},
				},
			],
		})
	}

	const renderStorageBindGroupLayout = device.createBindGroupLayout({
		label: "Render bing group layout",
		entries: [
			// Storage buffer
			{
				binding: 0,
				buffer: {
					type: "read-only-storage",
				},
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
			},
		],
	})
	const createRenderStorageBindGroup = (storageBuffer: GPUBuffer) => {
		return device.createBindGroup({
			layout: renderStorageBindGroupLayout,
			label: "Render bing group",
			entries: [
				{
					binding: 0,
					resource: storageBuffer,
				},
			],
		})
	}

	const vertexData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1])
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: vertexData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	const indexData = new Uint32Array([0, 1, 2, 1, 2, 3])
	const indexBuffer = device.createBuffer({
		label: "Index buffer",
		size: indexData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX,
	})
	device.queue.writeBuffer(indexBuffer, 0, indexData)

	const renderShaderModule = device.createShaderModule({
		label: "Render shader module",
		code: renderShaderCode,
	})

	const renderPipeline = device.createRenderPipeline({
		label: "Render pipeline",
		layout: device.createPipelineLayout({
			label: "Render pipeline layout",
			bindGroupLayouts: [
				renderUniformBindGroupLayout,
				renderStorageBindGroupLayout,
			],
		}),
		vertex: {
			entryPoint: "vs_main",
			module: renderShaderModule,
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
					format: navigator.gpu.getPreferredCanvasFormat(),
				},
			],
		},
	})
	return {
		renderPipeline,
		createRenderStorageBindGroup,
		createRenderUniformBindGroup,
		indexBuffer,
		vertexBuffer,
		vertexData,
		indexData,
	}
}

const getUniform = (device: GPUDevice, canvas: HTMLCanvasElement) => {
	// 2 int8 for canvas size
	// 1 int8 for pixel density
	// 1 int8 for theme (dark or light)
	// Total: 3 int8 = 12 bytes + some padding to align to 16 bytes
	const uniformSize = 2 + 1 + 1
	const uniformData = new Uint32Array(uniformSize)

	const uniformBuffer = device.createBuffer({
		label: "Uniform buffer",
		size: uniformData.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
	})

	const updateUniformBuffer = () => {
		const cellPixelDensity = jotaiStore.get(cellPixelDensityAtom)
		const theme = jotaiStore.get(themeAtom)
		uniformData.set([canvas.width, canvas.height, cellPixelDensity], 0)
		if (theme === "dark") {
			uniformData.set([1], 3)
		} else {
			uniformData.set([0], 3)
		}
		device.queue.writeBuffer(uniformBuffer, 0, uniformData)
	}
	updateUniformBuffer()
	return {
		uniformBuffer,
		updateUniformBuffer,
	}
}

export interface GameOfLife {
	canvas: HTMLCanvasElement
	draw: () => void
	computeAndDraw: () => void
	reset: () => void
	randomize: () => void
	toggle: (screenX: number, screenY: number) => void
	updateUniformBuffer: () => void
	resetStorages: () => void
	updateStorageByStructure: (structure: StructureType) => void
}

export const initGameOfLife = async (): Promise<GameOfLife> => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#game-of-life") as HTMLCanvasElement

	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("WebGPU not supported")
	}

	const format = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format,
		alphaMode: "premultiplied",
	})

	const {
		renderPipeline,
		createRenderStorageBindGroup,
		createRenderUniformBindGroup,
		vertexBuffer,
		indexBuffer,
		indexData,
	} = getRenderPipeline(device)
	const {
		computePipeline,
		createComputeStorageBindGroup,
		createComputeUniformBindGroup,
	} = getComputePipeline(device)

	resetStorages(device, canvas)

	if (!storage) {
		throw new Error("Storage not initialized")
	}

	const { uniformBuffer, updateUniformBuffer } = getUniform(device, canvas)

	const renderUniformBindGroup = createRenderUniformBindGroup(uniformBuffer)
	const computeUniformBindGroup = createComputeUniformBindGroup(uniformBuffer)

	const computePass = (encoder: GPUCommandEncoder) => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const { cellWidth, cellHeight } = storage
		const computePass = encoder.beginComputePass({
			label: "Compute pass",
		})
		const time = jotaiStore.get(timeAtom)
		computePass.setPipeline(computePipeline)
		let computeStorageBindGroup: GPUBindGroup
		if (time % 2 === 0) {
			computeStorageBindGroup = createComputeStorageBindGroup(
				storage.storageBuffer1,
				storage.storageBuffer2,
			)
		} else {
			computeStorageBindGroup = createComputeStorageBindGroup(
				storage.storageBuffer2,
				storage.storageBuffer1,
			)
		}
		computePass.setBindGroup(0, computeUniformBindGroup)
		computePass.setBindGroup(1, computeStorageBindGroup)
		const nbWorkgroupsX = Math.ceil(cellWidth / 16)
		const nbWorkgroupsY = Math.ceil(cellHeight / 16)
		computePass.dispatchWorkgroups(nbWorkgroupsX, nbWorkgroupsY)
		computePass.end()
	}

	const renderPass = (encoder: GPUCommandEncoder, storageBuffer: GPUBuffer) => {
		const textureView = context.getCurrentTexture()
		const renderPass = encoder.beginRenderPass({
			label: "Render pass",
			colorAttachments: [
				{
					loadOp: "load",
					storeOp: "store",
					view: textureView,
				},
			],
		})
		renderPass.setPipeline(renderPipeline)
		const renderStorageBindGroup = createRenderStorageBindGroup(storageBuffer)

		renderPass.setBindGroup(0, renderUniformBindGroup)
		renderPass.setBindGroup(1, renderStorageBindGroup)
		renderPass.setVertexBuffer(0, vertexBuffer)
		renderPass.setIndexBuffer(indexBuffer, "uint32")
		renderPass.drawIndexed(indexData.length)
		renderPass.end()
	}

	const draw = () => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const { storageBuffer1, storageBuffer2 } = storage
		const time = jotaiStore.get(timeAtom)
		let storageBufferRendered: GPUBuffer
		if (time % 2 === 0) {
			storageBufferRendered = storageBuffer1
		} else {
			storageBufferRendered = storageBuffer2
		}
		const renderEncoder = device.createCommandEncoder()
		renderPass(renderEncoder, storageBufferRendered)
		device.queue.submit([renderEncoder.finish()])
	}

	const computeAndDraw = () => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const { storageBuffer1, storageBuffer2 } = storage
		const encoder = device.createCommandEncoder({
			label: "Command encoder",
		})
		const time = jotaiStore.get(timeAtom)
		computePass(encoder)
		let storageBufferRendered: GPUBuffer
		if (time % 2 === 0) {
			storageBufferRendered = storageBuffer2
		} else {
			storageBufferRendered = storageBuffer1
		}
		renderPass(encoder, storageBufferRendered)
		device.queue.submit([encoder.finish()])
		jotaiStore.set(timeAtom, time + 1)
	}

	const reset = () => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const { storageBuffer1, storageBuffer2, cellWidth, cellHeight } = storage
		const storageData = new Uint32Array(cellWidth * cellHeight)
		for (let i = 0; i < cellHeight; i++) {
			const lineOffset = i * cellWidth
			for (let j = 0; j < cellWidth; j++) {
				const colOffset = lineOffset + j
				storageData.set([0], colOffset)
			}
		}
		;[storageBuffer1, storageBuffer2].forEach((storageBuffer) => {
			device.queue.writeBuffer(storageBuffer, 0, storageData)
		})
		jotaiStore.set(timeAtom, 0)
		draw()
	}

	const randomize = () => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const { storageBuffer1, storageBuffer2, cellWidth, cellHeight } = storage
		const storageData = new Uint32Array(cellWidth * cellHeight)
		for (let i = 0; i < cellHeight; i++) {
			const lineOffset = i * cellWidth
			for (let j = 0; j < cellWidth; j++) {
				const colOffset = lineOffset + j
				if (Math.floor(Math.random() * 10) > 1) {
					storageData.set([0], colOffset)
				} else {
					storageData.set([1], colOffset)
				}
			}
		}
		;[storageBuffer1, storageBuffer2].forEach((storageBuffer) => {
			device.queue.writeBuffer(storageBuffer, 0, storageData)
		})
		draw()
	}

	const toggle = async (screenX: number, screenY: number) => {
		if (!storage) {
			throw new Error("Storage not initialized")
		}
		const {
			storageBuffer1,
			storageBuffer2,
			stagingBuffer1,
			stagingBuffer2,
			cellWidth,
			cellHeight,
		} = storage
		const rect = canvas.getBoundingClientRect()
		const x = Math.floor(
			((screenX * devicePixelRatio - rect.left) / rect.width) * cellWidth,
		)
		const y = Math.floor(
			((screenY * devicePixelRatio - rect.top) / rect.height) * cellHeight,
		)
		const index = y * cellWidth + x
		const time = jotaiStore.get(timeAtom)
		let currentBuffer: { storage: GPUBuffer; staging: GPUBuffer }
		if (time % 2 === 0) {
			currentBuffer = {
				storage: storageBuffer1,
				staging: stagingBuffer1,
			}
		} else {
			currentBuffer = {
				storage: storageBuffer2,
				staging: stagingBuffer2,
			}
		}
		const copyEncoder = device.createCommandEncoder()
		copyEncoder.copyBufferToBuffer(
			currentBuffer.storage,
			0,
			currentBuffer.staging,
			0,
			currentBuffer.storage.size,
		)
		device.queue.submit([copyEncoder.finish()])

		await currentBuffer.staging.mapAsync(GPUMapMode.READ)

		const data = new Uint32Array(currentBuffer.staging.getMappedRange())
		const isAlive = data[index] === 1
		if (isAlive) {
			data[index] = 0
		} else {
			data[index] = 1
		}
		device.queue.writeBuffer(currentBuffer.storage, 0, data)
		currentBuffer.staging.unmap()
		draw()
	}

	return {
		draw,
		computeAndDraw,
		reset,
		randomize,
		toggle,
		canvas,
		updateUniformBuffer,
		resetStorages: () => resetStorages(device, canvas),
		updateStorageByStructure: (structure: StructureType) =>
			updateStorageByStructure(device, structure),
	}
}
