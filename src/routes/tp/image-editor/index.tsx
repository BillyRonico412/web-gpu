import { createFileRoute } from "@tanstack/react-router"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ImageEditorSidebar } from "@/routes/tp/image-editor/-components/-sidebar"
import { CANVAS_ID } from "@/routes/tp/image-editor/-wgpu"

export const Route = createFileRoute("/tp/image-editor/")({
	component: RouteComponent,
})

function RouteComponent() {
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
