import { useAtomValue } from "jotai"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import type { AABB, Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

const Row = (props: { label: string; value: string }) => {
	return (
		<tr>
			<td className="text-muted-foreground py-1">{props.label}</td>
			<td className="pl-4 font-medium">{props.value}</td>
		</tr>
	)
}

const statsByObjects3D = (objects3D: Object3D[], aabb: AABB) => {
	const vertexCount = objects3D.reduce(
		(acc, obj) => acc + obj.vertexes.length / 4,
		0,
	)
	const triangleCount = objects3D.reduce(
		(acc, obj) => acc + obj.vertexIndexes.length / 3,
		0,
	)
	const sizeX = aabb.max[0] - aabb.min[0]
	const sizeY = aabb.max[1] - aabb.min[1]
	const sizeZ = aabb.max[2] - aabb.min[2]
	const primitiveCount = objects3D.length
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
		const aabb = viewer.aabb
		const objects3D = viewer.objects3D
		stats = statsByObjects3D(objects3D, aabb)
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
