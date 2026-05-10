import { atom, useAtom } from "jotai"
import type { ReactNode } from "react"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

export const waitMessageAtom = atom<ReactNode | undefined>()
export const WaitMessage = () => {
	const [waitMessage, setWaitMessage] = useAtom(waitMessageAtom)
	if (!waitMessage) {
		return null
	}
	return (
		<AlertDialog
			open={!!waitMessage}
			onOpenChange={(open) => {
				if (!open) {
					setWaitMessage(undefined)
				}
			}}
		>
			<AlertDialogContent>
				<div className="flex flex-col items-center gap-4">
					<Spinner />
					{waitMessage}
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
