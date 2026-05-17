import { Box, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HierarchyNode } from "@/routes/tp/viewer/-gpu/logic/-types"

export const PsItem = (props: { hierarchyNode: HierarchyNode }) => {
	return (
		<div
			className="flex items-center gap-1.5 w-full hover:bg-accent cursor-pointer h-full"
			style={{ paddingLeft: `${props.hierarchyNode.depth * 8}px` }}
			title={props.hierarchyNode.name}
		>
			<Button variant="ghost" size="icon-sm">
				<ChevronRight className="size-3 shrink-0" />
			</Button>
			<Box className="size-3 shrink-0" />
			<span className="flex-1 truncate">{props.hierarchyNode.name}</span>
		</div>
	)
}
