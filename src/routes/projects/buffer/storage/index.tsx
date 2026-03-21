import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { run } from "@/routes/projects/buffer/storage/-wgpu"

export const Route = createFileRoute("/projects/buffer/storage/")({
	component: RouteComponent,
})

function RouteComponent() {
	useEffect(() => {
		run()
	}, [])
	return (
		<div className="w-full h-full flex items-center-safe justify-center-safe">
			<div className="flex flex-col items-center gap-4">
				<canvas
					id="uniform-canvas"
					width="300"
					height="300"
					className="border"
				/>
			</div>
		</div>
	)
}
