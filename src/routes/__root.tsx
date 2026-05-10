import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const queryClient = new QueryClient()

const RootLayout = () => (
	<QueryClientProvider client={queryClient}>
		<ThemeProvider>
			<TooltipProvider delay={200}>
				<Outlet />
			</TooltipProvider>
			<Toaster />
		</ThemeProvider>
	</QueryClientProvider>
)

export const Route = createRootRoute({ component: RootLayout })
