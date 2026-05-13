/**
 * proxy-bridge.js
 * Minimal HTTP CONNECT proxy en localhost:8877
 * Recibe CONNECT de Chromium y abre SOCKS5 con auth a Webshare.
 * proxy-chain tiene bugs con Chromium; este usa net + socks directamente.
 */
const net    = require('net')
const { SocksClient } = require('socks')
const logger = require('../utils/logger')

let _localProxyUrl = null
let _server = null

async function startProxyBridge () {
  const upstream = process.env.PROXY_SERVER
  const user     = process.env.PROXY_USERNAME
  const pass     = process.env.PROXY_PASSWORD

  if (!upstream || !user || !pass) return null

  const upstreamUrl = new URL(upstream)
  const socksHost   = upstreamUrl.hostname
  const socksPort   = parseInt(upstreamUrl.port) || 1080
  const localPort   = parseInt(process.env.PROXY_BRIDGE_PORT) || 8877

  _server = net.createServer((clientSocket) => {
    let buffer = Buffer.alloc(0)

    clientSocket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      const str = buffer.toString()

      // Esperar a tener la cabecera completa (doble CRLF)
      if (!str.includes('\r\n\r\n')) return

      const firstLine = str.split('\r\n')[0]
      const match = firstLine.match(/^CONNECT ([^:]+):(\d+) HTTP/)

      if (!match) {
        clientSocket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
        clientSocket.destroy()
        return
      }

      const destHost = match[1]
      const destPort = parseInt(match[2])

      SocksClient.createConnection({
        proxy: {
          host:     socksHost,
          port:     socksPort,
          type:     5,
          userId:   user,
          password: pass
        },
        command:     'connect',
        destination: { host: destHost, port: destPort }
      })
        .then(({ socket: socksSocket }) => {
          clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n')
          clientSocket.pipe(socksSocket)
          socksSocket.pipe(clientSocket)
          clientSocket.on('error', () => socksSocket.destroy())
          socksSocket.on('error', () => clientSocket.destroy())
        })
        .catch((err) => {
          logger.warn('SOCKS5 connect error', { dest: `${destHost}:${destPort}`, error: err.message })
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n')
          clientSocket.destroy()
        })
    })

    clientSocket.on('error', () => {})
  })

  await new Promise((resolve, reject) => {
    _server.listen(localPort, '127.0.0.1', resolve)
    _server.on('error', reject)
  })

  _localProxyUrl = `http://localhost:${localPort}`
  logger.info('Proxy bridge iniciado', { local: _localProxyUrl, socks: `${socksHost}:${socksPort}` })
  return _localProxyUrl
}

function getLocalProxyUrl () {
  return _localProxyUrl
}

module.exports = { startProxyBridge, getLocalProxyUrl }
