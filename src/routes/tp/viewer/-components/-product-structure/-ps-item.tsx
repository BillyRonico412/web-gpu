import type { HierarchyNode } from "@/routes/tp/viewer/-gpu/logic/-types"

export const PsItem = (props: { hierarchyNode: HierarchyNode }) => {
	return (
		<div
			style={{
				paddingLeft: props.hierarchyNode.depth * 8,
			}}
		>
			{props.hierarchyNode.name}
		</div>
	)
}
