import "@/index.css"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { routeTree } from "@/routeTree.gen"

// Import the generated route tree

const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const rootElement = document.getElementById("root")
if (!rootElement) {
	throw new Error("Root element not found")
}
if (!rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(
		<RouterProvider router={router} disableGlobalCatchBoundary={true} />,
	)
}
