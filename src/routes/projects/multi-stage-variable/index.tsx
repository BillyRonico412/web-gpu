import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { run } from "@/routes/projects/multi-stage-variable/-wgpu"

export const Route = createFileRoute("/projects/multi-stage-variable/")({
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
					id="multi-stage-variable-canvas"
					width="600"
					height="400"
					className="border"
				/>
			</div>
		</div>
	)
}
