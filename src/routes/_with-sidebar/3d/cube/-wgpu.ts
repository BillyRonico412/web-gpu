import { mat4, utils, vec3 } from "wgpu-matrix"
import { initWebGPU } from "@/lib/webgpu"
import renderShaderCode from "@/routes/_with-sidebar/3d/cube/-render-shader.wgsl?raw"

const cubeObj = {
	vertexes: [
		// Back face
		[-1, -1, -1],
		[1, 1, -1],
		[1, -1, -1],

		[-1, -1, -1],
		[-1, 1, -1],
		[1, 1, -1],

		// Front face
		[-1, -1, 1],
		[1, -1, 1],
		[1, 1, 1],

		[-1, -1, 1],
		[1, 1, 1],
		[-1, 1, 1],

		// Left face
		[-1, -1, -1],
		[-1, -1, 1],
		[-1, 1, 1],

		[-1, -1, -1],
		[-1, 1, 1],
		[-1, 1, -1],

		// Right face
		[1, -1, -1],
		[1, 1, 1],
		[1, -1, 1],

		[1, -1, -1],
		[1, 1, -1],
		[1, 1, 1],

		// Top face
		[-1, 1, -1],
		[1, 1, 1],
		[1, 1, -1],

		[-1, 1, -1],
		[-1, 1, 1],
		[1, 1, 1],

		// Bottom face
		[-1, -1, -1],
		[1, -1, -1],
		[1, -1, 1],

		[-1, -1, -1],
		[1, -1, 1],
		[-1, -1, 1],
	],
	indexes: [
		0,
		1,
		2,
		3,
		4,
		5, // Back face
		6,
		7,
		8,
		9,
		10,
		11, // Front face
		12,
		13,
		14,
		15,
		16,
		17, // Left face
		18,
		19,
		20,
		21,
		22,
		23, // Right face
		24,
		25,
		26,
		27,
		28,
		29, // Top face
		30,
		31,
		32,
		33,
		34,
		35, // Bottom face
	],
}

const faceColors = [
	[1, 0, 0], // Red
	[0, 1, 0], // Green
	[0, 0, 1], // Blue
	[1, 1, 0], // Yellow
	[1, 0, 1], // Magenta
	[0, 1, 1], // Cyan
]

const getRenderPipeline = (device: GPUDevice) => {
	const uniformBindGroupLayout = device.createBindGroupLayout({
		label: "Uniform bind group layout",
		entries: [
			// canvas size
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "uniform",
				},
			},
			// mvp matrix
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "uniform",
				},
			},
		],
	})
	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: renderShaderCode,
	})
	const renderPipeline = device.createRenderPipeline({
		label: "Render pipeline",
		layout: device.createPipelineLayout({
			label: "Render pipeline layout",
			bindGroupLayouts: [uniformBindGroupLayout],
		}),
		vertex: {
			module: shaderModule,
			entryPoint: "vs_main",
			buffers: [
				{
					arrayStride: 3 * 4 * 2,
					stepMode: "vertex",
					attributes: [
						// Position
						{
							shaderLocation: 0,
							offset: 0,
							format: "float32x3",
						},
						// Color
						{
							shaderLocation: 1,
							offset: 3 * 4,
							format: "float32x3",
						},
					],
				},
			],
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
			frontFace: "ccw",
		},
		depthStencil: {
			depthWriteEnabled: true,
			depthCompare: "less",
			format: "depth24plus",
		},
	})
	return {
		uniformBindGroupLayout,
		renderPipeline,
	}
}

const createObjBuffer = (device: GPUDevice) => {
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: cubeObj.vertexes.length * 3 * 4 * 2,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	faceColors
	device.queue.writeBuffer(
		vertexBuffer,
		0,
		new Float32Array(
			cubeObj.vertexes.flatMap((v, i) => {
				const color = faceColors[Math.floor(i / 6)]
				return [...v, ...color]
			}),
		),
	)

	const indexBuffer = device.createBuffer({
		label: "Index buffer",
		size: cubeObj.indexes.length * 4,
		usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(indexBuffer, 0, new Uint32Array(cubeObj.indexes))

	return {
		vertexBuffer,
		indexBuffer,
	}
}

const createBindGroupBuffer = (
	device: GPUDevice,
	canvas: HTMLCanvasElement,
) => {
	const canvasSizeBuffer = device.createBuffer({
		label: "Canvas size buffer",
		size: 2 * 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const mvpMatrixBuffer = device.createBuffer({
		label: "Model matrix buffer",
		size: 16 * 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const updateBindGroupBuffer = (params: {
		angleRotateX: number
		angleRotateY: number
		angleRotateZ: number
		distanceCamera: number
		fovAngle: number
	}) => {
		const { angleRotateX, angleRotateY, angleRotateZ, distanceCamera } = params
		device.queue.writeBuffer(
			canvasSizeBuffer,
			0,
			new Float32Array([canvas.width, canvas.height]),
		)

		const modelMatrix = mat4.identity()
		mat4.rotateX(modelMatrix, utils.degToRad(angleRotateX), modelMatrix)
		mat4.rotateY(modelMatrix, utils.degToRad(angleRotateY), modelMatrix)
		mat4.rotateZ(modelMatrix, utils.degToRad(angleRotateZ), modelMatrix)

		const eye = vec3.create(0, 0, distanceCamera)
		const target = vec3.create(0, 0, 0)
		const up = vec3.create(0, 1, 0)
		const viewMatrix = mat4.lookAt(eye, target, up)

		const projectionMatrix = mat4.perspective(
			utils.degToRad(params.fovAngle),
			canvas.width / canvas.height,
			0.1,
			100,
		)

		const mvpMatrix = mat4.multiply(
			projectionMatrix,
			mat4.multiply(viewMatrix, modelMatrix),
		)
		device.queue.writeBuffer(mvpMatrixBuffer, 0, mvpMatrix.buffer)
	}

	return {
		canvasSizeBuffer,
		mvpMatrixBuffer,
		updateBindGroupBuffer,
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

export type Cube = Awaited<ReturnType<typeof initCube>>

export const initCube = async () => {
	const { device } = await initWebGPU()
	const canvas = document.querySelector("#cube-canvas") as HTMLCanvasElement
	const context = canvas.getContext("webgpu")
	if (!context) {
		throw new Error("No context")
	}
	const format = navigator.gpu.getPreferredCanvasFormat()
	context.configure({
		device,
		format,
		alphaMode: "premultiplied",
	})

	const { uniformBindGroupLayout, renderPipeline } = getRenderPipeline(device)
	const { vertexBuffer, indexBuffer } = createObjBuffer(device)
	const { mvpMatrixBuffer, canvasSizeBuffer, updateBindGroupBuffer } =
		createBindGroupBuffer(device, canvas)
	const depthTexture = createDepthTexture(device, canvas)

	const draw = (params: {
		angleRotateX: number
		angleRotateY: number
		angleRotateZ: number
		distanceCamera: number
		fovAngle: number
	}) => {
		updateBindGroupBuffer(params)
		const uniformBindGroup = device.createBindGroup({
			label: "Uniform bind group",
			layout: uniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: canvasSizeBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: mvpMatrixBuffer,
					},
				},
			],
		})
		const commandEncoder = device.createCommandEncoder()
		const renderPass = commandEncoder.beginRenderPass({
			label: "Render pass",
			colorAttachments: [
				{
					view: context.getCurrentTexture(),
					loadOp: "clear",
					storeOp: "store",
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
				},
			],
			depthStencilAttachment: {
				view: depthTexture.createView(),
				depthClearValue: 1,
				depthLoadOp: "clear",
				depthStoreOp: "store",
			},
		})
		renderPass.setPipeline(renderPipeline)
		renderPass.setBindGroup(0, uniformBindGroup)
		renderPass.setVertexBuffer(0, vertexBuffer)
		renderPass.setIndexBuffer(indexBuffer, "uint32")
		renderPass.drawIndexed(cubeObj.indexes.length)
		renderPass.end()
		device.queue.submit([commandEncoder.finish()])
	}

	return { draw }
}
