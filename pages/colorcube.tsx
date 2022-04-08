import React, { useEffect, useRef } from "react";
import { getCubePosition } from ".";

export default function Colorcube(props: { color: number, colorlookup: string[] }) {
    const colorCubeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onLoad() {
            const canvas = colorCubeRef.current
            document.addEventListener('mousemove', (e) => {
                const pos = {
                    x: Math.round((e.clientX - 5) / 10) * 10,
                    y: Math.round((e.clientY - 5) / 10) * 10
        
                }
                
                if (canvas) {
                    canvas.style.left = `${pos.x}px`;
                    canvas.style.top = `${pos.y}px`;
                }
            })
        }
        onLoad()
        const current = colorCubeRef.current
        if(current) {
            current.style.backgroundColor = props.colorlookup[props.color]
        }
    }, [props.color, props.colorlookup])

    return (
        <div className="colorcube"  ref={colorCubeRef}>
            
        </div>
    )
  }
  