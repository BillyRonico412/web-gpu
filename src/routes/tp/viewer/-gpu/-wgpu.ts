import { type Mat4, mat4, type Vec3, vec3 } from "wgpu-matrix"
import { initWebGPU } from "@/lib/webgpu"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import renderShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-render-shader.wgsl?raw"

const parseObj = (objText: string) => {
	const vertexes: Vec3[] = []
	const normals: Vec3[] = []
	const faceData: { vertexIndex: number; normalIndex: number }[] = []
	const lines = objText.split("\n")
	for (const line of lines) {
		const parts = line.trim().split(/\s+/)
		if (parts[0] === "v") {
			const vertex = vec3.create()
			parts.slice(1, 4).forEach((it, i) => {
				vertex[i] = Number(it)
			})
			vertexes.push(vertex)
		} else if (parts[0] === "vn") {
			const normal = vec3.create()
			parts.slice(1, 4).forEach((it, i) => {
				normal[i] = Number(it)
			})
			normals.push(normal)
		} else if (parts[0] === "f") {
			const face = parts.slice(1).map((it) => {
				const [vertexIndex, , normalIndex] = it
					.split("/")
					.map((part) => Number(part) - 1)
				return { vertexIndex, normalIndex }
			})
			for (let i = 0; i < face.length - 2; i++) {
				faceData.push(
					{
						vertexIndex: face[0].vertexIndex,
						normalIndex: face[0].normalIndex,
					},
					{
						vertexIndex: face[i + 1].vertexIndex,
						normalIndex: face[i + 1].normalIndex,
					},
					{
						vertexIndex: face[i + 2].vertexIndex,
						normalIndex: face[i + 2].normalIndex,
					},
				)
			}
		}
	}
	return {
		vertexes,
		normals,
		faceData,
	}
}

const createObjBuffer = (device: GPUDevice, objText: string) => {
	const obj = parseObj(objText)

	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: obj.vertexes.length * 4 * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const vertexData = new Float32Array(obj.vertexes.length * 4)
	for (let i = 0; i < obj.vertexes.length; i++) {
		const vertex = obj.vertexes[i]
		vertexData.set(vertex, i * 4)
	}
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	const normalBuffer = device.createBuffer({
		label: "Normal buffer",
		size: obj.normals.length * 4 * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const normalData = new Float32Array(obj.normals.length * 4)
	for (let i = 0; i < obj.normals.length; i++) {
		const normal = obj.normals[i]
		normalData.set(normal, i * 4)
	}
	device.queue.writeBuffer(normalBuffer, 0, normalData)

	const faceBuffer = device.createBuffer({
		label: "Face buffer",
		size: obj.faceData.length * 4 * 2,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const faceData = new Uint32Array(obj.faceData.length * 2)
	for (let i = 0; i < obj.faceData.length; i++) {
		const face = obj.faceData[i]
		faceData.set([face.vertexIndex, face.normalIndex], i * 2)
	}
	device.queue.writeBuffer(faceBuffer, 0, faceData)

	return {
		obj,
		vertexBuffer,
		normalBuffer,
		faceBuffer,
	}
}

const createDepthTexture = (device: GPUDevice, canvas: HTMLCanvasElement) => {
	const depthTexture = device.createTexture({
		label: "Depth texture",
		size: [canvas.width, canvas.height],
		format: "depth24plus",
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})
	return depthTexture
}

const createMvpMatrixBuffer = (device: GPUDevice) => {
	const mvpMatrixBuffer = device.createBuffer({
		label: "MVP matrix buffer",
		size: 16 * 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const updateMvpMatrixBuffer = (viewMatrix: Mat4, projectionMatrix: Mat4) => {
		const modelMatrix = mat4.identity()
		const mvpMatrix = mat4.multiply(
			mat4.multiply(projectionMatrix, viewMatrix),
			modelMatrix,
		)
		device.queue.writeBuffer(mvpMatrixBuffer, 0, mvpMatrix.buffer)
	}
	return {
		mvpMatrixBuffer,
		updateMvpMatrixBuffer,
	}
}

const createLightDirectionBuffer = (device: GPUDevice) => {
	const lightDirectionBuffer = device.createBuffer({
		label: "Light direction buffer",
		size: 3 * 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	const updateLightDirectionBuffer = (lightDirection: Vec3) => {
		device.queue.writeBuffer(
			lightDirectionBuffer,
			0,
			new Float32Array(lightDirection),
		)
	}
	return {
		lightDirectionBuffer,
		updateLightDirectionBuffer,
	}
}

const createInterpolateNormalsBuffer = (device: GPUDevice) => {
	const interpolateNormalsBuffer = device.createBuffer({
		label: "Interpolate normals buffer",
		size: 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	const updateInterpolateNormalsBuffer = (interpolateNormals: boolean) => {
		device.queue.writeBuffer(
			interpolateNormalsBuffer,
			0,
			new Uint32Array([interpolateNormals ? 1 : 0]),
		)
	}
	return {
		interpolateNormalsBuffer,
		updateInterpolateNormalsBuffer,
	}
}

const getRenderPipeline = (device: GPUDevice) => {
	const uniformBindGroupLayout = device.createBindGroupLayout({
		label: "Render matrix bind group layout",
		entries: [
			// Mvp matrix
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "uniform",
				},
			},
			// Light direction
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
			// Interpolate normals
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})
	const storageBindGroupLayout = device.createBindGroupLayout({
		label: "Storage bind group layout",
		entries: [
			// Vertex buffer
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Normal buffer
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Face buffer
			{
				binding: 2,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
		],
	})
	const renderPipelineLayout = device.createPipelineLayout({
		label: "Render pipeline layout",
		bindGroupLayouts: [uniformBindGroupLayout, storageBindGroupLayout],
	})
	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: renderShaderCode,
	})
	const renderPipeline = device.createRenderPipeline({
		label: "Render pipeline",
		layout: renderPipelineLayout,
		vertex: {
			module: shaderModule,
			entryPoint: "vs_main",
		},
		fragment: {
			module: shaderModule,
			entryPoint: "fs_main",
			targets: [
				{
					format: navigator.gpu.getPreferredCanvasFormat(),
				},
			],
		},
		primitive: {
			topology: "triangle-list",
			cullMode: "back",
		},
		depthStencil: {
			format: "depth24plus",
			depthWriteEnabled: true,
			depthCompare: "less",
		},
	})
	return {
		uniformBindGroupLayout,
		storageBindGroupLayout,
		renderPipeline,
	}
}

export type Viewer = Awaited<ReturnType<typeof initViewer>>

export const initViewer = async (objText: string) => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("WebGPU is not supported in this browser.")
	}
	context.configure({
		device,
		format: navigator.gpu.getPreferredCanvasFormat(),
		alphaMode: "premultiplied",
	})
	const { vertexBuffer, normalBuffer, faceBuffer, obj } = createObjBuffer(
		device,
		objText,
	)
	const { uniformBindGroupLayout, renderPipeline, storageBindGroupLayout } =
		getRenderPipeline(device)
	let depthTexture = createDepthTexture(device, canvas)
	const { mvpMatrixBuffer, updateMvpMatrixBuffer } =
		createMvpMatrixBuffer(device)
	const { lightDirectionBuffer, updateLightDirectionBuffer } =
		createLightDirectionBuffer(device)
	const { interpolateNormalsBuffer, updateInterpolateNormalsBuffer } =
		createInterpolateNormalsBuffer(device)

	const draw = (params: {
		viewMatrix: Mat4
		projectionMatrix: Mat4
		lightDirection: Vec3
		interpolateNormals: boolean
		backgroundVec3: Vec3
	}) => {
		const {
			viewMatrix,
			backgroundVec3,
			projectionMatrix,
			lightDirection,
			interpolateNormals,
		} = params
		updateMvpMatrixBuffer(viewMatrix, projectionMatrix)
		updateLightDirectionBuffer(lightDirection)
		updateInterpolateNormalsBuffer(interpolateNormals)
		const commandEncoder = device.createCommandEncoder()
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: context.getCurrentTexture(),
					loadOp: "clear",
					storeOp: "store",
					clearValue: {
						r: backgroundVec3[0],
						g: backgroundVec3[1],
						b: backgroundVec3[2],
						a: 1,
					},
				},
			],
			depthStencilAttachment: {
				view: depthTexture.createView(),
				depthLoadOp: "clear",
				depthStoreOp: "store",
				depthClearValue: 1,
			},
		}
		const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(renderPipeline)

		const renderMatrixBindGroup = device.createBindGroup({
			label: "Render matrix bind group",
			layout: uniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: mvpMatrixBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: lightDirectionBuffer,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: interpolateNormalsBuffer,
					},
				},
			],
		})

		const storageBindGroup = device.createBindGroup({
			label: "Storage bind group",
			layout: storageBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: vertexBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: normalBuffer,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: faceBuffer,
					},
				},
			],
		})
		renderPass.setBindGroup(0, renderMatrixBindGroup)
		renderPass.setBindGroup(1, storageBindGroup)
		renderPass.setVertexBuffer(0, vertexBuffer)
		renderPass.draw(obj.faceData.length)
		renderPass.end()
		device.queue.submit([commandEncoder.finish()])
	}

	const getAABB = () => {
		const min = vec3.create(
			Number.POSITIVE_INFINITY,
			Number.POSITIVE_INFINITY,
			Number.POSITIVE_INFINITY,
		)
		const max = vec3.create(
			Number.NEGATIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
		)
		obj.vertexes.forEach((vertex) => {
			vec3.min(min, vertex, min)
			vec3.max(max, vertex, max)
		})
		const center = vec3.create()
		vec3.add(min, max, center)
		vec3.scale(center, 0.5, center)
		const radius = vec3.distance(min, max) / 2
		return {
			min,
			max,
			center,
			radius,
		}
	}

	const updateDepthTexture = () => {
		depthTexture.destroy()
		depthTexture = createDepthTexture(device, canvas)
	}

	return {
		draw,
		getAABB,
		updateDepthTexture,
		obj,
	}
}
