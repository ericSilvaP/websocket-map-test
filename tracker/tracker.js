const websocket = new WebSocket('ws://localhost:5679/')
let map = L.map('map').setView([51.505, -0.09], 13)
let marker = L.marker([51.5, -0.09]).addTo(map)
const params = new URLSearchParams(window.location.search)
const senderId = params.get('id')

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

websocket.addEventListener('open', () => {
  // Identifica como visualizador
  websocket.send(
    JSON.stringify({
      type: 'tracker',
      sender_id: senderId,
    })
  )
  map('map').setView([51.505, -0.09], 13)
})

// Atualiza marcador ao receber coordenadas
websocket.onmessage = ({ data }) => {
  const pos = JSON.parse(data)
  const coordContainer = document.querySelector('.ex')
  marker.setLatLng([pos.lat, pos.lng])
  map.setView([pos.lat, pos.lng], 13)
  coordContainer.textContent = `${pos.lat}, ${pos.lng}`
}
