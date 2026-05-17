import { MonitorPlay } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar"
import { LoadFileButton } from "@/routes/tp/viewer/-components/-load-file-button"
import { Ps } from "@/routes/tp/viewer/-components/-product-structure/-ps"
import { Settings } from "@/routes/tp/viewer/-components/-settings"

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
				<ResizablePanelGroup
					orientation="vertical"
					className="flex flex-col gap-4 overflow-hidden"
				>
					<ResizablePanel>
						<Ps />
					</ResizablePanel>
					<ResizableHandle withHandle={true} />
					<ResizablePanel>
						<Settings />
					</ResizablePanel>
				</ResizablePanelGroup>
			</SidebarContent>
			<SidebarFooter className="px-4 py-4 flex flex-row items-center justify-center">
				<ThemeToggle />
				<LoadFileButton />
			</SidebarFooter>
		</Sidebar>
	)
}
