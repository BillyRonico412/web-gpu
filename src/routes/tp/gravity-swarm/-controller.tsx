import { Link } from "@tanstack/react-router"
import { ArrowLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"

export const Controller = () => {
	return (
		<Sheet>
			<SheetTrigger className="fixed top-4 right-4">
				<Menu className="text-white" />
			</SheetTrigger>
			<SheetContent className="p-4">
				<SheetTitle>Gravity Swarm</SheetTitle>
				<SheetDescription>
					Un essaim de particules attirées ou repoussées par un point central.
					<br />
					Inspiré par:{" "}
					<a href="https://birgus.itch.io/particles" className="underline">
						https://birgus.itch.io/particles
					</a>
				</SheetDescription>
				<Card className="px-4 flex flex-col gap-2">
					<strong>Click gauche:</strong> Attirer les particules vers le point
					cliqué.
					<br />
					<strong>Click droit:</strong>
					Repousser les particules du point cliqué.
				</Card>
				<div className="mt-auto flex justify-center">
					<Link to="/">
						<Button>
							<ArrowLeft />
							Revenir à l'acceuil
						</Button>
					</Link>
				</div>
			</SheetContent>
		</Sheet>
	)
}
