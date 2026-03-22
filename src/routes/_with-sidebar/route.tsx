import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export const Route = createFileRoute("/_with-sidebar")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex flex-col w-full h-screen overflow-hidden">
				<SidebarTrigger />
				<div className="w-full flex-1 max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	)
}
