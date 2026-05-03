import { useAtomValue } from "jotai"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import type { Part } from "@/routes/tp/viewer/-gpu/logic/-types"
import type { AABB } from "@/routes/tp/viewer/-gpu/logic/utils/AABB"

const Row = (props: { label: string; value: string }) => {
	return (
		<tr>
			<td className="text-muted-foreground py-1">{props.label}</td>
			<td className="pl-4 font-medium">{props.value}</td>
		</tr>
	)
}

const statsByObjects3D = (parts: Part[], assemblyAabb: AABB) => {
	const vertexCount = parts.reduce(
		(acc, partItem) => acc + partItem.vertexes.length / 4,
		0,
	)
	const triangleCount = parts.reduce(
		(acc, partItem) => acc + partItem.vertexIndexes.length / 3,
		0,
	)
	const sizeX = assemblyAabb.max[0] - assemblyAabb.min[0]
	const sizeY = assemblyAabb.max[1] - assemblyAabb.min[1]
	const sizeZ = assemblyAabb.max[2] - assemblyAabb.min[2]
	const primitiveCount = parts.length
	return {
		vertexCount,
		triangleCount,
		sizeX,
		sizeY,
		sizeZ,
		primitiveCount,
	}
}

type Stats = ReturnType<typeof statsByObjects3D>

export const StatsSection = () => {
	const viewer = useAtomValue(gpuAtoms.viewerAtom)
	let stats: Stats | undefined
	if (viewer) {
		const assemblyAabb = viewer.assemblyAabb
		const parts = viewer.parts
		stats = statsByObjects3D(parts, assemblyAabb)
	}
	return (
		<table>
			<tbody>
				<Row
					label="Vertex count"
					value={stats ? stats.vertexCount.toLocaleString("en-US") : "N/A"}
				/>
				<Row
					label="Triangle count"
					value={stats ? stats.triangleCount.toLocaleString("en-US") : "N/A"}
				/>
				<Row
					label="Size X"
					value={stats ? stats.sizeX.toFixed(2).toLocaleString() : "N/A"}
				/>
				<Row
					label="Size Y"
					value={stats ? stats.sizeY.toFixed(2).toLocaleString() : "N/A"}
				/>
				<Row
					label="Size Z"
					value={stats ? stats.sizeZ.toFixed(2).toLocaleString() : "N/A"}
				/>
				<Row
					label="Primitives count"
					value={stats ? stats.primitiveCount.toLocaleString("en-US") : "N/A"}
				/>
			</tbody>
		</table>
	)
}
