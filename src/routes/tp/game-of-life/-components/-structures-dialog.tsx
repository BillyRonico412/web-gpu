import type { ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"

export const StructuresDialog = (props: { children: ReactNode }) => {
	return (
		<Dialog>
			<DialogTrigger>{props.children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Structure's catalog</DialogTitle>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
