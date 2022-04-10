import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { getCubePosition, Point } from ".";
import { colors } from '../public/colorlookup.json'

/*
export default function Colorcube(props: { color: number, colorlookup: string[], fillFollowingDot: boolean }) {
    const colorCubeRef = useRef<HTMLDivElement>(null);
    function onMouseMove(e: MouseEvent) {
        const canvas = colorCubeRef.current
        if(!canvas) return
        //const pos = {
        //    x: Math.round((e.clientX - canvas.clientWidth) / 10) * 10,
        //    y: Math.round((e.clientY - canvas.clientHeight + 10) / 10) * 10
        //}
        const pos = getCubePosition(e.clientX, e.clientY)
        
        if (canvas) {
            canvas.style.left = `${pos.x * 10}px`;
            canvas.style.top = `${pos.y * 10}px`;
        }
    }

    useEffect(() => {
        function onLoad() {
            const canvas = colorCubeRef.current
            document.addEventListener('mousemove', onMouseMove);
        }
        onLoad()
        
        const current = colorCubeRef.current
        if(current && props.fillFollowingDot) {
            current.style.backgroundColor = props.colorlookup[props.color]
        }
        if(current && !props.fillFollowingDot) {
            current.style.backgroundColor = 'transparent'
        }
    }, [props.color, props.colorlookup, props.fillFollowingDot])

    return (
        //<div className="colorcube"  ref={colorCubeRef}>
            
        //</div>
    )
  }
  */

  export default function Colorcube(props: { color: number, colorlookup: string[], position: Point, pointercolor: string, isOnDelay: number, loggedIn: boolean }) {
    const canvasRef = useRef(null)
    
  
    function draw() {
      const canvas = canvasRef.current as unknown as HTMLCanvasElement
      const context = canvas.getContext('2d') as CanvasRenderingContext2D
      
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
  
      context.fillStyle = '#000000'
      context.shadowColor = '#42445a';
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 9;

      //context.fillRect(0,0, 1000, 1000)
      //context.clearRect(0,0, 1000, 1000)
    }

    useEffect(() => {
        draw()
        const isOnDelay = props.isOnDelay != 0 || !props.loggedIn
        const realPos = props.position
        const canvas = canvasRef.current as unknown as HTMLCanvasElement
        const context = canvas.getContext('2d') as CanvasRenderingContext2D
        if(!isOnDelay) 
            context.fillStyle = colors[props.color]
        else
            context.fillStyle = props.pointercolor
        context.fillRect(realPos.x * 10, realPos.y * 10, 10, 10)
    }, [props.color, props.isOnDelay, props.loggedIn, props.pointercolor, props.position])

    return (
      <canvas ref={canvasRef} className="canvas ignorepoints"></canvas>
    )
  }
  