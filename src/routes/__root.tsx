import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"

const RootLayout = () => (
	<ThemeProvider>
		<Outlet />
	</ThemeProvider>
)

export const Route = createRootRoute({ component: RootLayout })
