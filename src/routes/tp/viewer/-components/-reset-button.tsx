import { RotateCcw } from "lucide-react"
import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const ResetButton = (props: ComponentProps<typeof Button>) => {
	return (
		<Button
			size="sm"
			variant="outline"
			{...props}
			className={cn(props.className)}
		>
			<RotateCcw />
			Reset
		</Button>
	)
}
