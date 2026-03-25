import { Link, type ToOptions } from "@tanstack/react-router"
import {
	Atom,
	Code,
	Database,
	Gpu,
	Home,
	type LucideIcon,
	Microchip,
	Moon,
	Sun,
	Wallpaper,
} from "lucide-react"
import { match } from "ts-pattern"
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

type ProjectLinkItem = {
	type: "item"
	name: string
	to: ToOptions["to"]
	icon: LucideIcon
}

type ProjectLinkGroup = {
	type: "group"
	name: string
	links: ProjectLinkItem[]
}

const projects: (ProjectLinkItem | ProjectLinkGroup)[] = [
	{
		type: "item",
		name: "Multi Stage Variable",
		to: "/multi-stage-variable",
		icon: Microchip,
	},
	{
		type: "group",
		name: "Buffers",
		links: [
			{
				type: "item",
				name: "Uniform",
				to: "/buffer/uniform",
				icon: Database,
			},
			{
				type: "item",
				name: "Storage",
				to: "/buffer/storage",
				icon: Database,
			},
			{
				type: "item",
				name: "Vertex",
				to: "/buffer/vertex",
				icon: Database,
			},
		],
	},
	{
		type: "group",
		name: "Textures",
		links: [
			{
				type: "item",
				name: "Texture 1",
				to: "/texture/texture-1",
				icon: Wallpaper,
			},
		],
	},
	{
		type: "group",
		name: "Travaux pratiques",
		links: [
			{
				type: "item",
				name: "Gravity swarm",
				to: "/tp/gravity-swarm",
				icon: Atom,
			},
		],
	},
]

const SidebarElementByProjectLinkItem = (props: { item: ProjectLinkItem }) => {
	return (
		<SidebarMenuItem key={props.item.to}>
			<Link to={props.item.to}>
				{({ isActive }) => (
					<SidebarMenuButton isActive={isActive}>
						<props.item.icon />
						{props.item.name}
					</SidebarMenuButton>
				)}
			</Link>
		</SidebarMenuItem>
	)
}

const SidebarElementByProjectLinkGroup = (props: {
	group: ProjectLinkGroup
}) => {
	return (
		<SidebarGroup key={props.group.name}>
			<SidebarGroupLabel>{props.group.name}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{props.group.links.map((link) => (
						<SidebarElementByProjectLinkItem key={link.to} item={link} />
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}

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
					<SidebarGroupContent>
						<SidebarMenu>
							{projects.map((projet) =>
								match(projet)
									.with({ type: "group" }, (project) => (
										<SidebarElementByProjectLinkGroup
											key={project.name}
											group={project}
										/>
									))
									.with({ type: "item" }, (project) => (
										<SidebarElementByProjectLinkItem
											key={project.to}
											item={project}
										/>
									))
									.exhaustive(),
							)}
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
