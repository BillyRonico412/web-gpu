import { atom, useAtom } from "jotai"
import type { ReactNode } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

export const waitMessageAtom = atom<ReactNode | undefined>()
export const waitFunctionAtomAtom = <T,>() =>
	atom(
		null,
		async (
			_,
			set,
			params: {
				fn: () => Promise<T>
				message: ReactNode
			},
		) => {
			const { fn, message } = params
			set(waitMessageAtom, message)
			try {
				return await fn()
			} finally {
				set(waitMessageAtom, undefined)
			}
		},
	)

export const WaitMessage = () => {
	const [waitMessage, setWaitMessage] = useAtom(waitMessageAtom)
	if (!waitMessage) {
		return null
	}
	return (
		<Dialog
			open={!!waitMessage}
			onOpenChange={(open) => {
				if (!open) {
					setWaitMessage(undefined)
				}
			}}
		>
			<DialogContent>
				<div className="flex flex-col items-center gap-4">
					<Spinner />
					{waitMessage}
				</div>
			</DialogContent>
		</Dialog>
	)
}
