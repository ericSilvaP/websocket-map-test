const websocket = new WebSocket('ws://localhost:5679/')
const sendButton = document.querySelector('.send-button')
const connectionStateDiv = document.querySelector('.connection-state')

websocket.addEventListener('open', () =>
  updateConnectionState(websocket, connectionStateDiv)
)
websocket.addEventListener('close', () =>
  updateConnectionState(websocket, connectionStateDiv)
)

sendButton.addEventListener('click', () => {
  sendCoordinates(websocket)
})

function connectSender() {
  websocket.addEventListener('open', () => {
    websocket.send(JSON.stringify({ type: 'sender' }))
  })
}

function getCoordinates() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject('Geolocalização não suportada.')
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject('Erro ao obter localização:' + err.message)
    )
  })
}

async function sendCoordinates(websocket) {
  try {
    const pos = await getCoordinates()
    if (websocketConnectionIsOpen(websocket))
      websocket.send(JSON.stringify(pos))
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

document.addEventListener('DOMContentLoaded', connectSender)
