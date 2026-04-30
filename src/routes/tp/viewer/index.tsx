import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ViewerSidebar } from "@/routes/tp/viewer/-components/-sidebar"
import { WaitMessage } from "@/routes/tp/viewer/-components/-wait-message"
import { canvasEventEffect } from "@/routes/tp/viewer/-event"
import { ChooseFileDialog } from "@/routes/tp/viewer/-gpu/-choose-file-dialog"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { gpuEffects } from "@/routes/tp/viewer/-gpu/-gpu-effect"
import { LoadFileEmpty } from "@/routes/tp/viewer/-gpu/-load-file-empty"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"

export const Route = createFileRoute("/tp/viewer/")({
	component: RouteComponent,
})

function RouteComponent() {
	useAtom(gpuEffects.canvasEffect)
	useAtom(gpuEffects.initViewerEffect)
	useAtom(gpuEffects.drawEffect)
	useAtom(gpuEffects.loadingStateEffect)
	useAtom(gpuEffects.drawEffect)
	useAtom(lightAtoms.lightModeEffect)
	useAtom(canvasEventEffect)
	return (
		<SidebarProvider>
			<ViewerSidebar />
			<main className="relative w-full h-dvh">
				<SidebarTrigger className="absolute" />
				<canvas
					id={CANVAS_ID}
					className="w-full h-full"
					onContextMenu={(e) => e.preventDefault()}
				/>
				<LoadFileEmpty />
			</main>
			<ChooseFileDialog />
			<WaitMessage />
		</SidebarProvider>
	)
}
