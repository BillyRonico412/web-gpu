import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { Controllers } from "@/routes/tp/viewer/-controllers"
import { canvasEventEffect } from "@/routes/tp/viewer/-event"
import { ChooseFileDialog } from "@/routes/tp/viewer/-gpu/-choose-file-dialog"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { gpuEffects } from "@/routes/tp/viewer/-gpu/-gpu-effect"

export const Route = createFileRoute("/tp/viewer/")({
	component: RouteComponent,
})

function RouteComponent() {
	useAtom(gpuEffects.canvasEffect)
	useAtom(gpuEffects.initViewerEffect)
	useAtom(gpuEffects.drawEffect)
	useAtom(canvasEventEffect)
	return (
		<main className="relative w-dvw h-dvh">
			<ChooseFileDialog />
			<div className="w-full h-full">
				<canvas
					id={CANVAS_ID}
					className="w-full h-full"
					onContextMenu={(e) => e.preventDefault()}
				/>
			</div>
			<div className="absolute top-4 right-4 z-10">
				<Controllers />
			</div>
		</main>
	)
}
