let websocket = null
const sendButton = document.querySelector('.send-button')
const connectionStateDiv = document.querySelector('.connection-state')
const RECONNECT_INTERVAL = 2000

let latestPosition = null

function manageWebsocketConnection(interval) {
  websocket = new WebSocket('ws://localhost:5679/')

  websocket.addEventListener('open', () => {
    connectSender()
    updateConnectionState(websocket, connectionStateDiv)

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          latestPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          websocket.send(JSON.stringify(latestPosition))
        },
        (err) => {
          console.log('Erro ao obter localização: ' + err)
        }
      )
    } else {
      console.log('Navegador não suporta geolocalização!')
    }
  })

  websocket.addEventListener('close', () => {
    updateConnectionState(websocket, connectionStateDiv)
    setTimeout(manageWebsocketConnection, interval)
  })
}

sendButton.addEventListener('click', () => {
  sendCoordinates(websocket)
})

function connectSender() {
  websocket.send(JSON.stringify({ type: 'product' }))
}

function sendCoordinates(websocket) {
  try {
    if (!latestPosition) {
      console.log('Aguarde uma posição ser armazenada.')
      return
    }
    if (websocketConnectionIsOpen(websocket))
      websocket.send(JSON.stringify(latestPosition))
  } catch (err) {
    alert(err)
  }
}

function websocketConnectionIsOpen(websocket) {
  return websocket.readyState === websocket.OPEN
}

function updateConnectionState(websocket, div) {
  if (websocketConnectionIsOpen(websocket)) {
    div.textContent = `Conectado ✅`
  } else {
    div.textContent = `Desconectado ❌`
  }
}

manageWebsocketConnection()
