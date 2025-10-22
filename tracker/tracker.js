const websocket = new WebSocket('ws://localhost:5679/')
let map = L.map('map').setView([51.505, -0.09], 13)
let user_marker = L.marker([51.5, -0.09]).addTo(map)
let product_marker = L.marker([51.5, -0.09]).addTo(map)
const params = new URLSearchParams(window.location.search)
const senderId = params.get('id')
const coordContainer = document.querySelector('.ex')

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

// document.addEventListener('DOMContentLoaded', () => {
//   if ('geolocation' in navigator) {
//     navigator.geolocation.getCurrentPosition((pos) => {
//       const lat = pos.coords.latitude
//       const lng = pos.coords.longitude
//       // ajusta o mapa e marcador para posição atual
//       map.setView([lat, lng], 13)
//       user_marker.setLatLng([lat, lng])
//       coordContainer.textContent = `${lat}, ${lng}`
//     })
//   }
// })

websocket.addEventListener('open', () => {
  // Identifica como visualizador
  websocket.send(
    JSON.stringify({
      type: 'tracker',
      sender_id: senderId,
    })
  )
})

// Atualiza marcador ao receber coordenadas
websocket.onmessage = ({ data }) => {
  const pos = JSON.parse(data)
  product_marker.setLatLng([pos.lat, pos.lng])
  map.setView([pos.lat, pos.lng], 13)
  coordContainer.textContent = `${pos.lat}, ${pos.lng}`
}
