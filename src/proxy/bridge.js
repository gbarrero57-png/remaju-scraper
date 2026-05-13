/**
 * proxy-bridge.js
 * Crea un proxy HTTP local en localhost:8877 sin autenticación
 * que reenvía al SOCKS5 de Webshare con auth.
 * Chromium no soporta SOCKS5 autenticado, pero sí HTTP proxy local.
 */
const ProxyChain = require('proxy-chain')
const logger = require('../utils/logger')

let _localProxyUrl = null

async function startProxyBridge () {
  const upstream = process.env.PROXY_SERVER   // socks5://p.webshare.io:1080
  const user     = process.env.PROXY_USERNAME
  const pass     = process.env.PROXY_PASSWORD

  if (!upstream) return null

  // Construir URL con credenciales
  const url  = new URL(upstream)
  const auth = (user && pass) ? `${user}:${pass}@` : ''
  const upstreamWithAuth = `${url.protocol}//${auth}${url.host}`

  const localPort = parseInt(process.env.PROXY_BRIDGE_PORT) || 8877

  const server = new ProxyChain.Server({
    port: localPort,
    prepareRequestFunction: () => ({
      upstreamProxyUrl: upstreamWithAuth
    })
  })

  await server.listen()
  _localProxyUrl = `http://localhost:${localPort}`
  logger.info('Proxy bridge iniciado', { local: _localProxyUrl, upstream: upstream })
  return _localProxyUrl
}

function getLocalProxyUrl () {
  return _localProxyUrl
}

module.exports = { startProxyBridge, getLocalProxyUrl }
