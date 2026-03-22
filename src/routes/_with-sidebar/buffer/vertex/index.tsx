import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { run } from "@/routes/_with-sidebar/buffer/vertex/-wgpu"

export const Route = createFileRoute("/_with-sidebar/buffer/vertex/")({
	component: RouteComponent,
})

function RouteComponent() {
	useEffect(() => {
		run()
	}, [])
	return (
		<div className="w-full h-full flex items-center-safe justify-center-safe">
			<div className="flex items-center mt-8">
				<canvas
					id="vertex-canvas"
					width="300"
					height="300"
					className="border"
				/>
			</div>
		</div>
	)
}
