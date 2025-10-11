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
  sendCoordinates()
})

function connectSender() {
  websocket.addEventListener('open', () => {
    websocket.send(JSON.stringify({ type: 'sender' }))
  })
}

function getCoordinates(callback) {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        callback({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        alert('Erro ao obter localização:' + err.message)
      }
    )
  } else {
    alert('Geolocalização não suportada.')
  }
}

function sendCoordinates() {
  getCoordinates((pos) => {
    websocketConnectionIsOpen((isOpen) => {
      if (isOpen) {
        websocket.send(JSON.stringify(pos))
      } else {
        console.log('User not connected.')
      }
    })
  })
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
