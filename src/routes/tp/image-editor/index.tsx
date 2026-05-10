import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { atoms } from "@/routes/tp/image-editor/-atom"
import { ImageEditorSidebar } from "@/routes/tp/image-editor/-components/-sidebar"
import { CANVAS_ID } from "@/routes/tp/image-editor/-wgpu"

export const Route = createFileRoute("/tp/image-editor/")({
	component: RouteComponent,
})

function RouteComponent() {
	useAtom(atoms.initImageEditorEffect)
	useAtom(atoms.loadImageEffect)
	useAtom(atoms.resizeEffect)
	useAtom(atoms.renderEffect)
	return (
		<SidebarProvider>
			<ImageEditorSidebar />
			<main className="w-full h-dvh">
				<SidebarTrigger className="absolute" />
				<canvas className="w-full h-full" id={CANVAS_ID} />
			</main>
		</SidebarProvider>
	)
}
