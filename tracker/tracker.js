const websocket = new WebSocket('ws://localhost:5679/')
let map = L.map('map').setView([51.505, -0.09], 13)
let polyline = null
let userMarker = L.marker([51.5, -0.09]).addTo(map)
let productMarker = L.marker([51.5, -0.09]).addTo(map)
let userCoords = { lat: '', lng: '' }
let productCoords = { lat: '', lng: '' }
let distance = null
const params = new URLSearchParams(window.location.search)
const productId = params.get('id')
const coordContainer = document.querySelector('.ex')
const simulateButton = document.querySelector('.simulate-container button')

simulateButton.addEventListener('click', () => {
  simulateMovement(10)
  simulateButton.disabled = true
})

function simulateMovement(steps) {
  let deltaLat = (userCoords.lat - productCoords.lat) / steps
  let deltaLng = (userCoords.lng - productCoords.lng) / steps
  let i = 0

  const interval = setInterval(() => {
    productCoords.lat += deltaLat
    productCoords.lng += deltaLng
    websocket.send(
      JSON.stringify({
        lat: productCoords.lat,
        lng: productCoords.lng,
        product_id: productId,
      })
    )
    updateDistance()
    updateLine()
    i++
    if (i >= steps) clearInterval(interval)
  }, 1000)
}

function calcDistance(pos1, pos2) {
  const R = 6372.795477598 // raio médio quadrático da Terra em km

  // Converter graus para radianos
  const toRad = (deg) => (deg * Math.PI) / 180

  const lat1 = toRad(pos1.lat)
  const lon1 = toRad(pos1.lng)
  const lat2 = toRad(pos2.lat)
  const lon2 = toRad(pos2.lng)

  // Fórmula da distância (lei dos cossenos esférica)
  const distance =
    R *
    Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
    )

  return distance ? distance : 0
}

// cria painel do mapa
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

// pega localização do usuario
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
      product_id: productId,
    })
  )
})

// Atualiza marcador ao receber coordenadas
websocket.onmessage = ({ data }) => {
  const pos = JSON.parse(data)
  productCoords.lat = pos.lat
  productCoords.lng = pos.lng

  // garante que os marcadores e linhas serão exibidas com as informações de localização do usuario
  updateMap()

  productMarker.setLatLng([productCoords.lat, productCoords.lng])
  map.setView([productCoords.lat, productCoords.lng], 13)
  coordContainer.textContent = `${pos.lat}, ${pos.lng}`
}

function updateDistance() {
  distance = calcDistance(userCoords, productCoords)
  document.querySelector('.distance').textContent = `Distância: ${Number(
    distance.toFixed(2)
  ).toLocaleString('pt-BR')} km`

  if (distance == 0) {
    const deliverMessage = document.querySelector('.deliver-message')
    deliverMessage.textContent = 'Seu pedido foi entregue!'

    simulateButton.disabled = true

    websocket.send(
      JSON.stringify({ status: 'delivered', product_id: productId })
    )
  }
}

function updateLine() {
  if (polyline !== null) polyline.remove()

  polyline = createLine(
    [userCoords.lat, userCoords.lng],
    [productCoords.lat, productCoords.lng]
  )
  polyline.addTo(map)
  map.fitBounds(polyline.getBounds())
}

function updateMap() {
  if (userCoords.lat && userCoords.lng) {
    updateDistance()
    updateLine()
  } else {
    setTimeout(updateMap, 2000)
  }
}

function createLine(pos1, pos2) {
  return L.polyline([pos1, pos2], {
    color: 'blue',
    weight: 3,
    opacity: 0.7,
    dashArray: '10, 10',
  })
}
