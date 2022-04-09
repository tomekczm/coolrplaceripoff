import { useRouter } from "next/router";
import { useEffect } from "react";

type Props = {
    palette: string[],
    changeColor: (color: number) => void
}

export default function Colorpalette(props: Props) {
    const palette = props.palette || []
    const changeColor = props.changeColor
    const router = useRouter()
    if(router.isFallback) {
        return <div>Loading...</div>
    }


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
  