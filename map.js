var map = L.map('map').setView([-2.947451, -41.752471], 20)

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

var marker = L.marker([-2.947455, -41.752471]).addTo(map)

var popup = L.popup()

function onMapClick(e) {
  const websocket = new WebSocket('ws://localhost:5678/')

  websocket.addEventListener('open', () => {
    websocket.send(JSON.stringify({ lat: e.latlng.lat, lgt: e.latlng.lng }))
    marker.setLatLng([lat, lgt])
  })
}

map.on('click', onMapClick)

function getLat() {
  return map.latlng.lng
}

document.addEventListener('DOMContentLoaded', () => {
  const websocket = new WebSocket('ws://localhost:5678/')

  websocket.onmessage = ({ data }) => {
    const container = document.querySelector('.ex')
    let pos = JSON.parse(data)
    container.textContent = `${pos.lat}, ${pos.lgt}`
    marker.setLatLng([pos.lat, pos.lgt])
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        // Envia coordenadas em tempo real

        websocket.send(JSON.stringify({ lat: lat, lgt: lng }))

        map.setView([lat, lng], map.getZoom())
      },
      (err) => {
        alert('Erro ao obter localização: ' + err)
      }
    )
  } else {
    alert('Seu navegador não suporta geolocalização!')
  }
})
