import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const RootLayout = () => (
	<ThemeProvider defaultTheme="dark">
		<SidebarProvider>
			<AppSidebar />
			<main className="flex flex-col w-full">
				<SidebarTrigger />
				<div className="w-full h-screen max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
		<Outlet />
	</ThemeProvider>
)

export const Route = createRootRoute({ component: RootLayout })
