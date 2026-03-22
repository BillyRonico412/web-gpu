import { useAtom } from "jotai"
import { Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { nbParticlesAtom } from "@/routes/tp/gravity-swarm/-atom"

export const Controller = () => {
	const [nbParticles, setNbParticles] = useAtom(nbParticlesAtom)
	return (
		<Sheet>
			<SheetTrigger className="fixed top-4 right-4">
				<Menu className="text-white" />
			</SheetTrigger>
			<SheetContent className="p-4">
				<FieldGroup>
					<FieldSet>
						<FieldLegend>Gravity Swarm</FieldLegend>
						<FieldDescription>
							Un essaim de particules attirées ou repoussées par un point
							central.
							<br />
							Inspiré par:{" "}
							<a href="https://birgus.itch.io/particles" className="underline">
								https://birgus.itch.io/particles
							</a>
						</FieldDescription>
					</FieldSet>
				</FieldGroup>
				<FieldGroup>
					<Field>
						<div className="flex items-center gap-2 justify-between">
							<FieldLabel>Nombre de particules</FieldLabel>
							<Badge>{nbParticles}</Badge>
						</div>
						<Slider
							value={nbParticles}
							min={100}
							max={5000}
							step={100}
							onValueChange={(n) => {
								if (typeof n === "number") {
									setNbParticles(n)
								}
							}}
						/>
					</Field>
				</FieldGroup>
			</SheetContent>
		</Sheet>
	)
}
