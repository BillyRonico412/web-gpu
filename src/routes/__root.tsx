import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"

const RootLayout = () => (
	<ThemeProvider defaultTheme="dark">
		<Outlet />
	</ThemeProvider>
)

export const Route = createRootRoute({ component: RootLayout })
