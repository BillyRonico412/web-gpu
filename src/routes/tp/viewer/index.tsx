import { createFileRoute } from "@tanstack/react-router"
import { useAtom, useSetAtom } from "jotai"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ViewerSidebar } from "@/routes/tp/viewer/-components/-sidebar"
import { WaitMessage } from "@/routes/tp/viewer/-components/-wait-message"
import { canvasEventEffect } from "@/routes/tp/viewer/-event"
import { ChooseFileDialog } from "@/routes/tp/viewer/-gpu/-choose-file-dialog"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { gpuEffects } from "@/routes/tp/viewer/-gpu/-gpu-effect"
import { LoadFileEmpty } from "@/routes/tp/viewer/-gpu/-load-file-empty"
import {
	pickingAtoms,
	RUBBER_BAND_ID,
} from "@/routes/tp/viewer/-gpu/-picking-atom"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"

export const Route = createFileRoute("/tp/viewer/")({
	component: RouteComponent,
})

function RouteComponent() {
	const pickMouseDownHandler = useSetAtom(pickingAtoms.mouseDownHandlerAtom)
	const pickMouseMoveHandler = useSetAtom(pickingAtoms.mouseMoveHandlerAtom)
	const pickMouseUpHandler = useSetAtom(pickingAtoms.mouseUpHandlerAtom)
	useAtom(gpuEffects.canvasEffect)
	useAtom(gpuEffects.initViewerEffect)
	useAtom(gpuEffects.drawEffect)
	useAtom(gpuEffects.loadingStateEffect)
	useAtom(gpuEffects.drawEffect)
	useAtom(lightAtoms.lightModeEffect)
	useAtom(pickingAtoms.rubberBandEffect)
	useAtom(pickingAtoms.deleteEffect)
	useAtom(canvasEventEffect)
	return (
		<SidebarProvider>
			<ViewerSidebar />
			<main className="relative w-full h-dvh">
				<SidebarTrigger className="absolute" />
				<canvas
					id={CANVAS_ID}
					className="w-full h-full relative"
					onContextMenu={(e) => e.preventDefault()}
					onMouseDownCapture={(e) => pickMouseDownHandler(e.nativeEvent)}
					onMouseMoveCapture={(e) => pickMouseMoveHandler(e.nativeEvent)}
					onMouseUpCapture={(e) => pickMouseUpHandler(e.nativeEvent)}
				/>
				<div
					className="absolute w-0 h-0 top-0 left-0 bg-yellow-400/10 border-2 border-yellow-400 hidden pointer-events-none"
					id={RUBBER_BAND_ID}
				/>
				<LoadFileEmpty />
			</main>
			<ChooseFileDialog />
			<WaitMessage />
		</SidebarProvider>
	)
}
