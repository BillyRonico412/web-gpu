import { type Vec3, vec3 } from "wgpu-matrix"
import { initWebGPU } from "@/lib/webgpu"
import shaderCode from "@/routes/tp/viewer/-gpu/-shaders/-flat-normal-shader.wgsl?raw"

export const computeFlatshadingNormals = async (
	vertexes: Vec3[],
	indexes: number[],
): Promise<{
	normals: Vec3[]
	normalIndexes: number[]
}> => {
	const { device } = await initWebGPU()
	const vertexesBuffer = device.createBuffer({
		size: vertexes.length * 4 * 4,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(
		vertexesBuffer,
		0,
		new Float32Array(vertexes.flatMap((v) => [v[0], v[1], v[2], 0])),
	)
	const indexesBuffer = device.createBuffer({
		size: indexes.length * 4,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(indexesBuffer, 0, new Uint32Array(indexes))
	const normalBufferSize = (indexes.length / 3) * 4 * 4
	const normalsBuffer = device.createBuffer({
		size: normalBufferSize,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
	})
	const normalIndexesBuffer = device.createBuffer({
		size: indexes.length * 4,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
	})
	const triangleCount = indexes.length / 3
	const triangleCountBuffer = device.createBuffer({
		size: 4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(
		triangleCountBuffer,
		0,
		new Uint32Array([triangleCount]),
	)
	const computeShaderModule = device.createShaderModule({
		code: shaderCode,
	})
	const computeBindGroupLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "read-only-storage" },
			},
			{
				binding: 1,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "read-only-storage" },
			},
			{
				binding: 2,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
			{
				binding: 3,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" },
			},
			{
				binding: 4,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "uniform" },
			},
		],
	})

	const computePipeline = device.createComputePipeline({
		layout: device.createPipelineLayout({
			bindGroupLayouts: [computeBindGroupLayout],
		}),
		compute: {
			module: computeShaderModule,
			entryPoint: "cs_main",
		},
	})
	const computeBindGroup = device.createBindGroup({
		layout: computeBindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: { buffer: vertexesBuffer },
			},
			{
				binding: 1,
				resource: { buffer: indexesBuffer },
			},
			{
				binding: 2,
				resource: { buffer: normalsBuffer },
			},
			{
				binding: 3,
				resource: { buffer: normalIndexesBuffer },
			},
			{
				binding: 4,
				resource: { buffer: triangleCountBuffer },
			},
		],
	})
	const commandEncoder = device.createCommandEncoder()
	const passEncoder = commandEncoder.beginComputePass()
	passEncoder.setPipeline(computePipeline)
	passEncoder.setBindGroup(0, computeBindGroup)
	passEncoder.dispatchWorkgroups(Math.ceil(indexes.length / 3 / 64))
	passEncoder.end()
	device.queue.submit([commandEncoder.finish()])
	const normalsReadBuffer = device.createBuffer({
		size: normalBufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	})
	const normalIndexesReadBuffer = device.createBuffer({
		size: indexes.length * 4,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	})
	const readCommandEncoder = device.createCommandEncoder()
	readCommandEncoder.copyBufferToBuffer(
		normalsBuffer,
		0,
		normalsReadBuffer,
		0,
		normalBufferSize,
	)
	readCommandEncoder.copyBufferToBuffer(
		normalIndexesBuffer,
		0,
		normalIndexesReadBuffer,
		0,
		indexes.length * 4,
	)
	device.queue.submit([readCommandEncoder.finish()])
	await normalsReadBuffer.mapAsync(GPUMapMode.READ)
	await normalIndexesReadBuffer.mapAsync(GPUMapMode.READ)
	const normalsArray = new Float32Array(normalsReadBuffer.getMappedRange())
	const normalIndexesArray = new Uint32Array(
		normalIndexesReadBuffer.getMappedRange(),
	)
	const normals: Vec3[] = []
	for (let i = 0; i < normalsArray.length; i += 4) {
		normals.push(
			vec3.fromValues(
				normalsArray[i],
				normalsArray[i + 1],
				normalsArray[i + 2],
			),
		)
	}
	const normalIndexes: number[] = []
	for (let i = 0; i < normalIndexesArray.length; i++) {
		normalIndexes.push(normalIndexesArray[i])
	}
	normalsReadBuffer.unmap()
	normalIndexesReadBuffer.unmap()
	vertexesBuffer.destroy()
	indexesBuffer.destroy()
	normalsBuffer.destroy()
	normalIndexesBuffer.destroy()
	normalsReadBuffer.destroy()
	normalIndexesReadBuffer.destroy()
	return { normals, normalIndexes }
}
