import hexRgb from "hex-rgb"
import rgbHex from "rgb-hex"
import { type Vec4, vec4 } from "wgpu-matrix"
import { Input } from "@/components/ui/input"

export const ColorPicker = (props: {
	color: Vec4
	onChange: (color: Vec4) => void
}) => {
	const value = rgbHex(
		Math.round(props.color[0] * 255),
		Math.round(props.color[1] * 255),
		Math.round(props.color[2] * 255),
	)
	return (
		<Input
			type="color"
			value={`#${value}`}
			onChange={(e) => {
				const hex = e.target.value
				const rgb = hexRgb(hex)
				const newColor = vec4.fromValues(
					rgb.red / 255,
					rgb.green / 255,
					rgb.blue / 255,
				)
				props.onChange(newColor)
			}}
			className="size-8 p-0 border-0"
		/>
	)
}
