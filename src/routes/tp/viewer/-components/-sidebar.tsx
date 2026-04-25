import {
	Camera,
	Info,
	Lightbulb,
	MonitorPlay,
	Palette,
	Torus,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar"
import { BackgroundSection } from "@/routes/tp/viewer/-background/-background-section"
import { CameraSection } from "@/routes/tp/viewer/-camera/-camera-section"
import { LoadFileButton } from "@/routes/tp/viewer/-components/-load-file-button"
import { LightSection } from "@/routes/tp/viewer/-light/-light-section"
import { RenderingSection } from "@/routes/tp/viewer/-rendering/-rendering-section"
import { StatsSection } from "@/routes/tp/viewer/-stats/-stats-section"

export const ViewerSidebar = () => {
	return (
		<Sidebar>
			<SidebarHeader>
				<h2 className="text-lg font-semibold flex justify-center items-center gap-2">
					<MonitorPlay />
					Viewer
				</h2>
			</SidebarHeader>
			<SidebarContent>
				<Accordion multiple={true}>
					<AccordionItem>
						<AccordionTrigger>
							<Torus className="size-5 text-muted-foreground" />
							Rendering
						</AccordionTrigger>
						<AccordionContent>
							<RenderingSection />
						</AccordionContent>
					</AccordionItem>
					<AccordionItem>
						<AccordionTrigger>
							<Camera className="size-5 text-muted-foreground" />
							Camera
						</AccordionTrigger>
						<AccordionContent>
							<CameraSection />
						</AccordionContent>
					</AccordionItem>
					<AccordionItem>
						<AccordionTrigger>
							<Lightbulb className="size-5 text-muted-foreground" />
							Light
						</AccordionTrigger>
						<AccordionContent>
							<LightSection />
						</AccordionContent>
					</AccordionItem>
					<AccordionItem>
						<AccordionTrigger>
							<Palette className="size-5 text-muted-foreground" />
							Background
						</AccordionTrigger>
						<AccordionContent>
							<BackgroundSection />
						</AccordionContent>
					</AccordionItem>
					<AccordionItem>
						<AccordionTrigger>
							<Info className="size-5 text-muted-foreground" />
							Statistics
						</AccordionTrigger>
						<AccordionContent>
							<StatsSection />
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</SidebarContent>
			<SidebarFooter className="px-4 py-4 flex flex-row items-center justify-center">
				<ThemeToggle />
				<LoadFileButton />
			</SidebarFooter>
		</Sidebar>
	)
}
