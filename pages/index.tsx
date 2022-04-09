import type { GetServerSidePropsContext, NextPage, PreviewData } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Colorpalette from './colorpalette'
import io, { Socket } from 'socket.io-client'
import { DefaultEventsMap } from '@socket.io/component-emitter'
import { Colorcube } from './colorcube'
import { ParsedUrlQuery } from 'querystring'
import { getCookie } from 'cookies-next'
import Loginbutton from './loginbutton'
import LoginModal from './LoginModal'
import prettyMilliseconds from 'pretty-ms'
import * as colorLookup from '../public/colorlookup.json'
import Tooltip from './tooltip'
import ConfirmBox from './confirmbox'

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

type UserMapRevied = {
  [key: string]: string
}

export type Point = { x: number, y: number }

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

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const Home = (props: Props) => {
  const [usermap, setUserMap] = useState<UserMapRevied>({})
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false)
  const [tooltipText, setTooltipText] = useState('')
  const colorLookup = props.colorLookup
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState(0)
  const [pointerColor, setPointerColor] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [fillFollowingDot, setFillFollowingDot] = useState(true)
  const loggedIn = props.isLoggedIn
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 })

  function _setusermap(key: string, value: string) {
    setUserMap({
      ...usermap,
      [key]: value
    })
  }

  function getUsermap(key: string) {
    return usermap[key]
  }

  let stedyTimeout: number | undefined = undefined

  function updateTimer(endTime: number) {
    const now = +Date.now()
    const timeLeft = endTime - now
    const withoutMs = timeLeft - (timeLeft % 1000)    
    setFillFollowingDot(false)
    if(timeLeft < 0) {
      setCooldown(0)
      setFillFollowingDot(true)
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
        console.log(data)
        draw(data.pixels)
        const userMapRecived = data.users
        console.log(userMapRecived)
        try {
          const json = userMapRecived
          for (const [key, value] of Object.entries(json)) {
            if(typeof value !== 'string') continue
            _setusermap(key, value)
          }
        }catch(err) {
          console.error(err)
        }

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
        const key = JSON.stringify({x: data.x, y: data.y})
        _setusermap(key, data.name)
      })

      document.addEventListener('click', (e) => {
        //whenStedy(e)
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
    setFillFollowingDot(false)
  }

  function onMouseOver(event: React.MouseEvent) {
    setIsMouseOverCanvas(true)
  }
  function onMouseOut(event: React.MouseEvent) {
    setIsMouseOverCanvas(false)
  }

  function onMouseMove(e: React.MouseEvent) {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const box = canvas.getBoundingClientRect();
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    const realPos = getCubePosition(x, y)
    
    const nickname = getUsermap(JSON.stringify(realPos))

    if(nickname)
      setTooltipText(nickname || 'Joe Biden')
    else
      setTooltipText('')

    const data = context.getImageData(realPos.x * 10, realPos.y * 10, 10, 10).data
    if(data[4] == 0) {
      setIsMouseOverCanvas(false)
    } else {
      setIsMouseOverCanvas(true)
    }

    setPoint({ x: realPos.x, y: realPos.y })
    if(cooldown != 0 || !loggedIn) {
      const hex = rgbToHex(data[0], data[1], data[2])
      setPointerColor(hex)
    }
  }
  const fillCube = cooldown == 0 || loggedIn

  return (
    <>
    { tooltipText != '' && <ConfirmBox name={tooltipText}></ConfirmBox>}
    <canvas ref={canvasRef} className="canvas" onClick={onclick} onMouseMove={onMouseMove} onMouseLeave={onMouseOut} onMouseOver={onMouseOver}>
    </canvas>
    { isMouseOverCanvas && <Colorcube color={color} colorlookup={colorLookup} position={point} pointercolor={pointerColor} isOnDelay={cooldown} loggedIn={loggedIn}></Colorcube> }
    { cooldown != 0 && <div className="cooldown">Cooldown: {prettyMilliseconds(cooldown, {verbose: true})}</div>}
    { (cooldown == 0 && loggedIn) &&
          <>
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
