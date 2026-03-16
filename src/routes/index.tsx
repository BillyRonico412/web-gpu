import { createFileRoute } from "@tanstack/react-router"
import { Code, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="mx-auto p-4 flex justify-center-safe items-center-safe w-full h-full">
			<div className="w-full flex flex-col gap-4">
				<h1 className="text-xl font-bold text-center">
					Apprentissage de wgpu avec Rust
				</h1>
				<p className="text-center">
					Cette application est mon carnet de bord pour apprendre à utiliser
					wgpu avec Rust.
					<br />
					Pour chaque projet, vous aurez une petite description, le code source
					et une démo en direct.
				</p>
				<div className="flex items-center gap-2 justify-center">
					<a
						href="https://github.com/BillyRonico412/web-gpu/tree/master"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button>
							<Code />
							Github
						</Button>
					</a>
					<a
						href="https://www.ronico-billy.fr"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button>
							<User />
							Portfolio
						</Button>
					</a>
				</div>
			</div>
		</div>
	)
}
