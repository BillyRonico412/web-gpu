import shaderCode from "@/routes/tp/viewer/-gpu/-shaders/-compute-normal-shader.wgsl?raw"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

export const createNormalBuffer = (params: {
	device: GPUDevice
	objects3D: Object3D[]
	vertexBuffer: GPUBuffer
	vertexIndexBuffer: GPUBuffer
	shadingMode: "flat" | "smooth"
}): {
	normalBuffer: GPUBuffer
	normalIndexBuffer: GPUBuffer
} => {
	const { device, objects3D, vertexBuffer, vertexIndexBuffer } = params
	const allVertexes = objects3D.flatMap((o) => o.vertexes)
	const allVertexIndexes = objects3D.flatMap((o) => o.vertexIndexes)
	const triangleCount = allVertexIndexes.length / 3
	const uniformBuffer = device.createBuffer({
		size: 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(uniformBuffer, 0, new Uint32Array([triangleCount]))

	const computeShaderModule = device.createShaderModule({
		code: shaderCode,
	})

	const computeBindGroupLayout = device.createBindGroupLayout({
		entries: [
			// Uniform
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "uniform" },
			},
			// Vertex buffer
			{
				binding: 1,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "read-only-storage" },
			},
			// Vertex index buffer
			{
				binding: 2,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "read-only-storage" },
			},

			// Flat normal buffer
			{
				binding: 3,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
			// Flat normal index buffer
			{
				binding: 4,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
			// Smooth normal buffer
			{
				binding: 5,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
			// Smooth normal index buffer
			{
				binding: 6,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
		],
	})

	const createComputePipeline = (numPass: "flat" | "sum" | "smooth") => {
		return device.createComputePipeline({
			layout: device.createPipelineLayout({
				bindGroupLayouts: [computeBindGroupLayout],
			}),
			compute: {
				module: computeShaderModule,
				entryPoint: `pass_${numPass}`,
			},
		})
	}
	const computePipelineFlat = createComputePipeline("flat")
	const computePipelineSum = createComputePipeline("sum")
	const computePipelineSmooth = createComputePipeline("smooth")

	const flatNormalBuffer = device.createBuffer({
		label: "Flat normal buffer",
		size: triangleCount * 4 * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const flatNormalIndexBuffer = device.createBuffer({
		label: "Flat normal index buffer",
		size: allVertexIndexes.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const smoothNormalBuffer = device.createBuffer({
		label: "Smooth normal buffer",
		size: allVertexes.length * 4 * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const smoothNormalIndexBuffer = device.createBuffer({
		label: "Smooth normal index buffer",
		size: allVertexIndexes.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const computeBindGroup = device.createBindGroup({
		layout: computeBindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: { buffer: uniformBuffer },
			},
			{
				binding: 1,
				resource: { buffer: vertexBuffer },
			},
			{
				binding: 2,
				resource: { buffer: vertexIndexBuffer },
			},
			{
				binding: 3,
				resource: { buffer: flatNormalBuffer },
			},
			{
				binding: 4,
				resource: { buffer: flatNormalIndexBuffer },
			},
			{
				binding: 5,
				resource: { buffer: smoothNormalBuffer },
			},
			{
				binding: 6,
				resource: { buffer: smoothNormalIndexBuffer },
			},
		],
	})

	const commandEncoder = device.createCommandEncoder()

	const passFlatEncoder = commandEncoder.beginComputePass()
	passFlatEncoder.setPipeline(computePipelineFlat)
	passFlatEncoder.setBindGroup(0, computeBindGroup)
	passFlatEncoder.dispatchWorkgroups(Math.ceil(triangleCount / 64))
	passFlatEncoder.end()

	const passSumEncoder = commandEncoder.beginComputePass()
	passSumEncoder.setPipeline(computePipelineSum)
	passSumEncoder.setBindGroup(0, computeBindGroup)
	passSumEncoder.dispatchWorkgroups(Math.ceil(allVertexIndexes.length / 64))
	passSumEncoder.end()

	const passSmoothEncoder = commandEncoder.beginComputePass()
	passSmoothEncoder.setPipeline(computePipelineSmooth)
	passSmoothEncoder.setBindGroup(0, computeBindGroup)
	passSmoothEncoder.dispatchWorkgroups(Math.ceil(allVertexes.length / 64))
	passSmoothEncoder.end()

	device.queue.submit([commandEncoder.finish()])

	switch (params.shadingMode) {
		case "flat":
			return {
				normalBuffer: flatNormalBuffer,
				normalIndexBuffer: flatNormalIndexBuffer,
			}
		case "smooth":
			return {
				normalBuffer: smoothNormalBuffer,
				normalIndexBuffer: smoothNormalIndexBuffer,
			}
	}
}
