const websocket = new WebSocket('ws://localhost:5679/')
let map = L.map('map').setView([51.505, -0.09], 13)
let userMarker = L.marker([51.5, -0.09]).addTo(map)
let productMarker = L.marker([51.5, -0.09]).addTo(map)
let userCoords = { lat: '', lng: '' }
let productCoords = { lat: '', lng: '' }
const params = new URLSearchParams(window.location.search)
const senderId = params.get('id')
const coordContainer = document.querySelector('.ex')

function calcDistance(userPos, productPos) {
  const R = 6372.795477598 // raio médio quadrático da Terra em km

  // Converter graus para radianos
  const toRad = (deg) => (deg * Math.PI) / 180

  const lat1 = toRad(userPos.lat)
  const lon1 = toRad(userPos.lng)
  const lat2 = toRad(productPos.lat)
  const lon2 = toRad(productPos.lng)

  // Fórmula da distância (lei dos cossenos esférica)
  const distance =
    R *
    Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
    )

  return distance
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude
    // ajusta o mapa e marcador para posição atual
    userCoords.lat = lat
    userCoords.lng = lng

    map.setView([lat, lng], 13)
    userMarker.setLatLng([lat, lng])
    coordContainer.textContent = `${lat}, ${lng}`
  })
}

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
  productCoords.lat = pos.lat
  productCoords.lng = pos.lng

  updateDistance()
  productMarker.setLatLng([productCoords.lat, productCoords.lng])
  map.setView([lat, lng], 13)
  coordContainer.textContent = `${pos.lat}, ${pos.lng}`
}

function updateDistance() {
  if (!userCoords.lat && !userCoords.lng) {
    setTimeout(updateDistance, 2000)
  }
  const distance = calcDistance(userCoords, productCoords)
  document.querySelector('.distance').textContent = `Distância: ${Number(
    distance.toFixed(2)
  ).toLocaleString('pt-BR')} km`
}
