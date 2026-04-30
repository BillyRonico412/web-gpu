import { type Mat4, mat4 } from "wgpu-matrix"
import pickingShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-picking-shader.wgsl?raw"
import type {
	Object3D,
	ObjectBufferResources,
	TexView,
} from "@/routes/tp/viewer/-gpu/logic/-types"

type PickingUniform = {
	mvp: { viewMatrix: Mat4; projectionMatrix: Mat4 }
}

export const createPickingPassRessources = (device: GPUDevice) => {
	const pickingUniformData = new Float32Array(16) // 16 floats for the mvp matrix

	const pickingUniformBuffer = device.createBuffer({
		label: "Picking uniform buffer",
		size: 16 * 4, // 64 bytes: mvp matrix
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const pickingUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Picking uniform bind group layout",
		entries: [
			// Mvp matrix
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createPickingUniformBindGroup = (pickingUniform: PickingUniform) => {
		const { mvp } = pickingUniform
		const modelMatrix = mat4.identity()
		const mvpMatrix = mat4.multiply(
			mat4.multiply(mvp.projectionMatrix, mvp.viewMatrix),
			modelMatrix,
		)
		pickingUniformData.set(mvpMatrix, 0)
		device.queue.writeBuffer(pickingUniformBuffer, 0, pickingUniformData)
		const pickingUniformBindGroup = device.createBindGroup({
			label: "Picking uniform bind group",
			layout: pickingUniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: pickingUniformBuffer,
					},
				},
			],
		})
		return pickingUniformBindGroup
	}

	const pickingStorageBindGroupLayout = device.createBindGroupLayout({
		label: "Picking storage bind group layout",
		entries: [
			// Vertex buffer
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Vertex index buffer
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Matrix buffer
			{
				binding: 2,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Matrix index buffer
			{
				binding: 3,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Geometric ID buffer
			{
				binding: 4,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "read-only-storage",
				},
			},
		],
	})

	const createPickingStorageBindGroup = (params: {
		objectResources: ObjectBufferResources
	}) => {
		const {
			vertexBuffer,
			vertexIndexBuffer,
			matrixBuffer,
			matrixIndexBuffer,
			geometricIdBuffer,
		} = params.objectResources

		const pickingStorageBindGroup = device.createBindGroup({
			label: "Picking storage bind group",
			layout: pickingStorageBindGroupLayout,
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
						buffer: vertexIndexBuffer,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: matrixBuffer,
					},
				},
				{
					binding: 3,
					resource: {
						buffer: matrixIndexBuffer,
					},
				},
				{
					binding: 4,
					resource: {
						buffer: geometricIdBuffer,
					},
				},
			],
		})
		return pickingStorageBindGroup
	}

	const pickingPipelineLayout = device.createPipelineLayout({
		label: "Picking pipeline layout",
		bindGroupLayouts: [
			pickingUniformBindGroupLayout,
			pickingStorageBindGroupLayout,
		],
	})

	const pickingShaderModule = device.createShaderModule({
		label: "Picking shader module",
		code: pickingShaderCode,
	})

	const pickingPipeline = device.createRenderPipeline({
		label: "Picking pipeline",
		layout: pickingPipelineLayout,
		vertex: {
			module: pickingShaderModule,
			entryPoint: "vs_main",
		},
		fragment: {
			module: pickingShaderModule,
			entryPoint: "fs_main",
			targets: [
				{
					format: "r32uint",
				},
			],
		},
		primitive: {
			topology: "triangle-list",
		},
		depthStencil: {
			format: "depth24plus",
			depthWriteEnabled: true,
			depthCompare: "less",
		},
	})

	const doPickingPass = (params: {
		commandEncoder: GPUCommandEncoder
		objectBufferResources: ObjectBufferResources
		geometryIdTexView: TexView
		depthTexView: TexView
		context: GPUCanvasContext
		objects3D: Object3D[]
		mvp: { viewMatrix: Mat4; projectionMatrix: Mat4 }
	}) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: params.geometryIdTexView.view,
					loadOp: "clear",
					storeOp: "store",
				},
			],
			depthStencilAttachment: {
				depthClearValue: 1,
				view: params.depthTexView.view,
				depthLoadOp: "clear",
				depthStoreOp: "store",
			},
		}

		const renderPass =
			params.commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(pickingPipeline)
		const pickingUniformBindGroup = createPickingUniformBindGroup({
			mvp: params.mvp,
		})
		const pickingStorageBindGroup = createPickingStorageBindGroup({
			objectResources: params.objectBufferResources,
		})
		renderPass.setBindGroup(0, pickingUniformBindGroup)
		renderPass.setBindGroup(1, pickingStorageBindGroup)
		let nbDrawnVertices = 0
		for (const obj of params.objects3D) {
			nbDrawnVertices += obj.vertexIndexes.length
		}
		renderPass.draw(nbDrawnVertices)
		renderPass.end()
	}

	const pickingPassCleanUp = () => {
		pickingUniformBuffer.destroy()
	}

	return {
		doPickingPass,
		pickingPassCleanUp,
	}
}
