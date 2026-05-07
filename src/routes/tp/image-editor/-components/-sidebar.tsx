import { ImageDown, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar"

export const ImageEditorSidebar = () => {
	return (
		<Sidebar>
			<SidebarHeader>
				<h2 className="text-lg font-semibold flex justify-center items-center gap-2">
					<ImageIcon />
					Image editor
				</h2>
			</SidebarHeader>
			<SidebarContent />
			<SidebarFooter className="px-4 py-4 flex flex-row items-center justify-center">
				<Button>
					<ImageDown />
					Load image
				</Button>
			</SidebarFooter>
		</Sidebar>
	)
}
