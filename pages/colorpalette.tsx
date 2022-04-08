import { useEffect } from "react";

type Props = {
    palette: string[],
    changeColor: (color: number) => void
}

export default function Colorpalette(props: Props) {
    const palette = props.palette
    const changeColor = props.changeColor
  


    return (
        <div className="colorpalette">
            {palette.map((color, index) => {
                return (
                    <div className="color" key={index} style={{backgroundColor: color}} onClick={() => changeColor(index)}></div>
                )
            }
            )}
        </div>
    )
  }
  