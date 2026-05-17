import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useAtomValue } from "jotai"
import { CircleQuestionMark } from "lucide-react"
import { useRef } from "react"
import { ScrollBar } from "@/components/ui/scroll-area"
import { PsItem } from "@/routes/tp/viewer/-components/-product-structure/-ps-item"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

export const Ps = () => {
	const viewer = useAtomValue(gpuAtoms.viewerAtom)
	const parentRef = useRef<HTMLDivElement>(null)
	const rowVirtualizer = useVirtualizer({
		count: viewer ? viewer.hierarchyNodes.length : 0,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36,
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
		<ScrollAreaPrimitive.Root className="relative h-full w-full">
			<ScrollAreaPrimitive.Viewport
				ref={parentRef}
				className="size-full rounded-[inherit]"
			>
				<div
					className="relative"
					style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
				>
					{rowVirtualizer.getVirtualItems().map((virtualItem) => (
						<div
							key={virtualItem.key}
							className="absolute top-0 left-0 w-full px-2"
							style={{
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							<PsItem hierarchyNode={hierarchyNodes[virtualItem.index]} />
						</div>
					))}
				</div>
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	)
}
