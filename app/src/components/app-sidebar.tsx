import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
} from "@/components/ui/sidebar"

export const AppSidebar = () => {
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup />
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	)
}
