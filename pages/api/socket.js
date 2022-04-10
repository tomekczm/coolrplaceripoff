// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { prisma } from './login'
import { Server } from 'socket.io'
import prettyMilliseconds from 'pretty-ms'
import { parse } from 'cookie'
import { env } from 'process'
import * as colorLookup from '../../public/colorlookup.json'

const xSize = 100
const ySize = 100
const sockets = new Map()
let colorAmount = colorLookup.length
const cooldowns = new Map()
let pixels =  []
const usermap = new Map()

async function promiseTimeout(_timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, _timeout)
  })
}

async function fetchWithTimeout(resource, options = {}) {
  try {
    const response = fetch(resource, options);
    return await Promise.race(response, promiseTimeout(60000))
  } catch {
    return null
  }
}

for (let i = 0; i < xSize; i++) {
  pixels[i] = []
  for (let j = 0; j < ySize; j++) {
      pixels[i][j] = 0
  }
}

async function getLatestbackup() {
  try {
    const backupServer = process.env.BACKUP_SERVER
    const fetchRes = await fetch(`${backupServer}/backup`)
    if(!fetchRes) {
      console.log('No backup found (epic fail)')
      return
    }
    const json = await fetchRes.json()
    if(json.pixels) {
      pixels = json.pixels
    }
  } catch (err) {
    console.log(err)
  }
}

async function createBackup() {
  console.log('Creating backup')
  try {
    const backupServer = process.env.BACKUP_SERVER
    const fetchRes = await fetch(`${backupServer}/createbackup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pixels: pixels
      })
    })
    setTimeout(() => {
      createBackup()
    }, 1000 * 60 * 30); 
  } catch (err) {
    console.log(err)
  }
}

(async () => {
  await getLatestbackup().catch(console.error)
  createBackup().catch(console.error)
})()

export default async function handler(
  req,
  res
) {
    if (res.socket.server.io) {
        console.log('Socket is already running')
      } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io
        sockets.set(io, 0)

        io.on('connection', socket => {
          const usermapJson = {}
          for(const [key, value] of usermap.entries()) {
            usermapJson[key] = value
          }
          socket.emit('init_packet', { pixels: pixels, users: usermapJson })
          const cookieHeader = socket.client.request.headers.cookie
          if(cookieHeader) {
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
          }
          socket.on('update_pixel', async (data) => {
            if(data.x > 99 || data.y > 99) return
            if(data.color > colorAmount) return
            if(data.color < 0) return
            const endTime = +Date.now() + 15 * 60 * 1000
            const code = data.code
            socket.emit('cooldown_time', endTime)
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
            cooldowns.set(code, {
              time: endTime,
              isOnCooldown: true
            })

            setTimeout(() => {
              cooldowns.set(code, {
                time: 0,
                isOnCooldown: false
              })
            }, 15 * 60 * 1000);
            
            pixels[data.y][data.x] = data.color
            data.name = query.name
            const indexName = JSON.stringify({x: data.x, y: data.y})
            usermap.set(indexName, data.name)
            socket.broadcast.emit('update_pixel', data)
          })
        })
      }
      res.end()
}
