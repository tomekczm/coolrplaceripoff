// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { prisma } from './login'
import { Server } from 'Socket.IO'
import prettyMilliseconds from 'pretty-ms'
import { parse } from 'cookie'

const xSize = 100
const ySize = 100
const sockets = new Map()
let colorAmount = 0
const cooldowns = new Map()

fetch('http://localhost:3000/colorLookup.json').then(res => res.json()).then(json => {
  colorAmount = json.colors.length
})

export default async function handler(
  req,
  res
) {
    let pixels =  []
    for (let i = 0; i < xSize; i++) {
        pixels[i] = []
        for (let j = 0; j < ySize; j++) {
            pixels[i][j] = 0
        }
    }
    if (res.socket.server.io) {
        console.log('Socket is already running')
      } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io
        sockets.set(io, 0)

        io.on('connection', socket => {
          socket.emit('init_packet', pixels)
          const cookies = parse(socket.client.request.headers.cookie)
          if(cookies && cookies.code) {
            const code = cookies.code
            const cooldown = cooldowns.get(code)
            if(cooldown) {
              if(cooldown.time >= +Date.now()) {
                socket.emit('cooldown_time', cooldown.time)
              }
            }
          }
          socket.on('update_pixel', async (data) => {
            if(data.x > 99 || data.y > 99) return
            if(data.color > colorAmount) return
            if(data.color < 0) return
            const code = data.code
            // Verify code

            const query = await prisma.user.findFirst({
              where: {
                access_code: code
              }
            })
            if(!query) {
              return
            }
            const cooldown = cooldowns.get(code)
            if(cooldown) {
              if(cooldown.time >= +Date.now()) {
                socket.emit('cooldown_time', cooldown.time)
                return
              }
              if(cooldown.isOnCooldown) return
            }
            const endTime = +Date.now() + 15 * 60 * 1000
            cooldowns.set(code, {
              time: endTime,
              isOnCooldown: true
            })
            socket.emit('cooldown_time', endTime)

            setTimeout(() => {
              cooldowns.set(code, {
                time: 0,
                isOnCooldown: false
              })
            }, 15 * 60 * 1000);
            
            console.log("set")
            pixels[data.y][data.x] = data.color
            socket.broadcast.emit('update_pixel', data)
          })
        })
      }
      res.end()
}
