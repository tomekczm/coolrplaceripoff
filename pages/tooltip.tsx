import { useEffect, useRef } from "react";

export default function Tooltip(props: {text: string}) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    function onMouseMove(e: MouseEvent) {
        const canvas = tooltipRef.current
        if (canvas) {
            //console.log('move')
            canvas.style.left = `${e.clientX}px`;
            canvas.style.top = `${e.clientY}px`;
        }
    }

    useEffect(() => {
        function onLoad() {
            const canvas = tooltipRef.current
            document.addEventListener('mousemove', onMouseMove);
        }
        onLoad()
        
    }, [])

    return (
        <div className="Tooltip"  ref={tooltipRef}>
            <h1>{props.text}</h1>
        </div>
    )
  }
  