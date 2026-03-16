import { createFileRoute } from "@tanstack/react-router"
import { Minus, Plus } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { init } from "@/routes/projects/uniform/-wgpu-1"

export const Route = createFileRoute("/projects/uniform/")({
	component: RouteComponent,
})

const data = {
	speed: 1,
}

function RouteComponent() {
	useEffect(() => {
		data.speed = 1
		let animationFrameId: number | undefined
		;(async () => {
			const update = await init()
			const frame = () => {
				update(data.speed)
				animationFrameId = requestAnimationFrame(frame)
			}
			animationFrameId = requestAnimationFrame(frame)
		})()
		return () => {
			if (!animationFrameId) {
				return
			}
			cancelAnimationFrame(animationFrameId)
		}
	}, [])
	return (
		<div className="w-full h-full flex items-center-safe justify-center-safe">
			<div className="flex flex-col items-center gap-4">
				<canvas
					id="uniform-canvas"
					width="600"
					height="400"
					className="border"
				/>
				<div>
					<Field orientation="horizontal">
						<FieldLabel>Vitesse</FieldLabel>
						<ButtonGroup>
							<Button
								size="icon-sm"
								onClick={() => {
									data.speed -= 1
								}}
							>
								<Minus />
							</Button>
							<Button
								size="icon-sm"
								onClick={() => {
									data.speed += 1
								}}
							>
								<Plus />
							</Button>
						</ButtonGroup>
					</Field>
				</div>
			</div>
		</div>
	)
}
