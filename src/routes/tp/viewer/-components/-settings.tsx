import { Camera, Info, Lightbulb, Torus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { CameraSection } from "@/routes/tp/viewer/-camera/-camera-section"
import { LightSection } from "@/routes/tp/viewer/-light/-light-section"
import { RenderingSection } from "@/routes/tp/viewer/-rendering/-rendering-section"
import { StatsSection } from "@/routes/tp/viewer/-stats/-stats-section"

export const Settings = () => {
	return (
		<Tabs>
			<TabsList className="mx-auto">
				<Tooltip>
					<TooltipTrigger render={<TabsTrigger value="rendering" />}>
						<Torus className="size-5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>Rendering</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<TabsTrigger value="camera" />}>
						<Camera className="size-5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>Camera</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<TabsTrigger value="light" />}>
						<Lightbulb className="size-5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>Light</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<TabsTrigger value="stats" />}>
						<Info className="size-5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>Stats</TooltipContent>
				</Tooltip>
			</TabsList>
			<div className="px-4 py-4">
				<TabsContent value="rendering">
					<RenderingSection />
				</TabsContent>
				<TabsContent value="camera">
					<CameraSection />
				</TabsContent>
				<TabsContent value="light">
					<LightSection />
				</TabsContent>
				<TabsContent value="stats">
					<StatsSection />
				</TabsContent>
			</div>
		</Tabs>
	)
}
