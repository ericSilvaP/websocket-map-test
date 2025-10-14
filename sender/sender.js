const websocket = new WebSocket('ws://localhost:5679/')
const sendButton = document.querySelector('.send-button')
const connectionStateDiv = document.querySelector('.connection-state')

let latestPosition = null
// websocket.addEventListener('open', () =>
//   updateConnectionState(websocket, connectionStateDiv)
// )

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

websocket.addEventListener('close', () =>
  updateConnectionState(websocket, connectionStateDiv)
)

sendButton.addEventListener('click', () => {
  sendCoordinates(websocket)
})

function connectSender() {
  websocket.send(JSON.stringify({ type: 'sender' }))
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
