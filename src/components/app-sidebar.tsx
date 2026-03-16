import { Link, type ToOptions } from "@tanstack/react-router"
import { Code, Gpu, Home, Microchip, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"

const projets: { name: string; to: ToOptions["to"] }[] = [
	{
		name: "Multi Stage Variable",
		to: "/projects/multi-stage-variable",
	},
	{
		name: "Uniform",
		to: "/projects/uniform",
	},
]

export const AppSidebar = () => {
	const { theme, setTheme } = useTheme()
	return (
		<Sidebar variant="floating">
			<SidebarHeader>
				<h1 className="font-bold flex items-center gap-2 justify-center">
					<Gpu />
					Apprendre WGPU
				</h1>
				<p className="text-center">
					<Button variant="link">Ronico BILLY</Button>
				</p>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<Link to="/">
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<Home />
										Accueil
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Projets</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{projets.map((projet) => (
								<SidebarMenuItem key={projet.to}>
									<Link to={projet.to}>
										{({ isActive }) => (
											<SidebarMenuButton isActive={isActive}>
												<Microchip />
												{projet.name}
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="flex flex-row items-center justify-center">
				<Button
					variant="outline"
					size="icon"
					onClick={() => setTheme(theme === "light" ? "dark" : "light")}
				>
					<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
				<Button>
					<Code />
					Github
				</Button>
			</SidebarFooter>
		</Sidebar>
	)
}
