import type { GetServerSidePropsContext, NextPage, PreviewData } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Colorpalette from './colorpalette'
import io, { Socket } from 'socket.io-client'
import { DefaultEventsMap } from '@socket.io/component-emitter'
import Colorcube from './colorcube'
import { ParsedUrlQuery } from 'querystring'
import { getCookie } from 'cookies-next'
import Loginbutton from './loginbutton'
import LoginModal from './LoginModal'
import prettyMilliseconds from 'pretty-ms'
import * as colorLookup from '../public/colorlookup.json'

const xSize = 100
const ySize = 100
let socket: Socket<DefaultEventsMap, DefaultEventsMap>

type Context = GetServerSidePropsContext<ParsedUrlQuery, PreviewData>

export async function getServerSideProps(context: Context) {
  const login = context.req.cookies.code
  const isLoggedIn = login !== undefined

  return {
    props: {
      colorLookup: colorLookup.colors,
      isLoggedIn: isLoggedIn
    }
  }
}

type Props = {
  pixels: Array<number>,
  colorLookup: Array<string>,
  isLoggedIn: boolean
}

export function getCubePosition(x: number, y: number) {
  const xAmount = Math.floor(x / 10)
  const yAmount = Math.floor(y / 10)
  return {
    x: xAmount,
    y: yAmount
  }
}

const Home = (props: Props) => {
  const [loginPrompt, setLoginPrompt] = useState(false)
  const colorLookup = props.colorLookup
  const canvasRef = useRef(null)
  const [color, setColor] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [showFollowingDot, setShowFollowingDot] = useState(true)
  const loggedIn = props.isLoggedIn

  function updateTimer(endTime: number) {
    const now = +Date.now()
    const timeLeft = endTime - now
    const withoutMs = timeLeft - (timeLeft % 1000)    
    if(timeLeft < 0) {
      setCooldown(0)
      setShowFollowingDot(true)
    }else {
      setCooldown(withoutMs)
      setTimeout(() => updateTimer(endTime), 1000)
    }
  }

  useEffect(() => {
    async function socketInitializer() {
      await fetch('/api/socket')
      socket = io()
  
      socket.on('connect', () => {
        console.log('connected')
      })
  
      socket.on('disconnect', () => {
        console.log('disconnected')
      })
  
      socket.on('init_packet', (data) => {
        draw(data)
      })

      socket.on('cooldown_time', (data) => {
        const endTime = data
        updateTimer(endTime)
      })
  
      socket.on('update_pixel', (data) => {
        const canvas = canvasRef.current as unknown as HTMLCanvasElement
        const context = canvas.getContext('2d') as CanvasRenderingContext2D
        context.fillStyle = colorLookup[data.color]
        context.fillRect(data.x * 10, data.y * 10, 10, 10);
      })
      
    }
    socketInitializer()
  }, [])

  

  function draw(pixels: Array<Array<number>>) {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    for(let y = 0; y < pixels.length; y++) {
      for(let x = 0; x < pixels[y].length; x++) {
        const pixel = pixels[y][x]
        context.fillStyle = colorLookup[pixel]
        context.fillRect(x * 10, y * 10, 10, 10)
      }
    }
  }

  function onclick(event: React.MouseEvent) {
    if(!loggedIn || cooldown > 0)
      return

    const canvas = canvasRef.current as unknown as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    const realPos = getCubePosition(x, y)

    socket.emit('update_pixel', {
      x: realPos.x,
      y: realPos.y,
      color: color,
      code: getCookie('code')
    })
    context.fillStyle = colorLookup[color]
    context.fillRect(realPos.x * 10, realPos.y * 10, 10, 10)
    setShowFollowingDot(false)
  }

  return (
    <>
    <canvas ref={canvasRef} className="canvas" onClick={onclick}>
    </canvas>
  
    { cooldown != 0 && <div className="cooldown">Cooldown: {prettyMilliseconds(cooldown, {verbose: true})}</div>}
    { (cooldown == 0 && loggedIn) &&
          <>{showFollowingDot && <Colorcube color={color} colorlookup={colorLookup}></Colorcube>}
          <Colorpalette palette={colorLookup} changeColor={setColor}></Colorpalette></>
     }
    {!loggedIn &&
      <><Loginbutton showLoginPrompt={setLoginPrompt}></Loginbutton>
      <LoginModal show={loginPrompt}></LoginModal>
      </>
    }
    </>
  )
}

export default Home
