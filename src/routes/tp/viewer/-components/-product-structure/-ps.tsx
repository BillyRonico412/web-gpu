import { ScrollArea } from "@base-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useAtomValue } from "jotai"
import { CircleQuestionMark } from "lucide-react"
import { useRef } from "react"
import { ScrollBar, viewportClassName } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { PsItem } from "@/routes/tp/viewer/-components/-product-structure/-ps-item"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

export const Ps = () => {
	const viewer = useAtomValue(gpuAtoms.viewerAtom)
	const parentRef = useRef<HTMLDivElement>(null)
	const rowVirtualizer = useVirtualizer({
		count: viewer ? viewer.hierarchyNodes.length : 0,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 32,
	})
	if (!viewer) {
		return (
			<div className="w-full h-full flex flex-col gap-2 justify-center items-center">
				<CircleQuestionMark />
				<p className="text-center text-sm text-muted-foreground text-balance">
					No product structure available. Please load a model to see it
				</p>
			</div>
		)
	}
	const { hierarchyNodes } = viewer
	return (
		<ScrollArea.Root
			data-slot="scroll-area"
			className="h-full w-full relative overflow-auto"
			ref={parentRef}
		>
			<ScrollArea.Viewport
				data-slot="scroll-area-viewport"
				className={cn(viewportClassName)}
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualItem) => (
					<div
						key={virtualItem.key}
						className="absolute top-0 left-0 w-full"
						style={{
							height: `${virtualItem.size}px`,
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						<PsItem hierarchyNode={hierarchyNodes[virtualItem.index]} />
					</div>
				))}
				<ScrollBar />
				<ScrollArea.Corner />
			</ScrollArea.Viewport>
		</ScrollArea.Root>
	)
}
