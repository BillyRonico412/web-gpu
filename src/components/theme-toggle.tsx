import { useAtom } from "jotai"
import { Moon, Sun } from "lucide-react"
import { themeAtom } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export const ThemeToggle = () => {
	const [theme, setTheme] = useAtom(themeAtom)
	return (
		<Button
			size="icon-lg"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
