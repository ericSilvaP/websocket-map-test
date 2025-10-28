const nullProducts = document.getElementById('nullProduct')
const clientsContainer = document.querySelector('.clients-container')
const RECONNECT_INTERVAL = 2000
const params = new URLSearchParams(window.location.search)
const productId = params.get('id')
const simulateButton = document.querySelector('.simulate-container button')
let websocket = null
let map = initMap()
let userMarker = null
let productMarker = null
let polyline = null
let userCoords = { lat: '', lng: '' }
let productCoords = { lat: '', lng: '' }
let distance = null
let isSimulating = false

function initMap() {
  let map = L.map('map').setView([-2.90472, -41.7767], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)
  return map
}

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

function createClient(id, name = '') {
  const clientElement = document.createElement('div')
  const clientLink = document.createElement('a')

  clientElement.classList.add('client')
  clientLink.href = `?id=${id}`
  clientLink.classList.add('client-link')

  if (!name) {
    clientLink.textContent = `Selecionar cliente - ${id}`
  } else {
    clientLink.textContent = `${name}`
  }

  clientElement.appendChild(clientLink)
  return clientElement
}

function updateDistance() {
  const deliverMessage = document.querySelector('.deliver-message')
  distance = calcDistance(userCoords, productCoords)
  document.querySelector('.distance').textContent = `Distância: ${Number(
    distance.toFixed(2)
  ).toLocaleString('pt-BR')} km`

  if (distance == 0) {
    deliverMessage.textContent = 'Seu pedido foi entregue!'
    simulateButton.disabled = true
    productMarker.unbindTooltip()
    websocket.send(
      JSON.stringify({ status: 'delivered', product_id: productId })
    )
  } else {
    deliverMessage.textContent = 'Pedido em rota de entrega...'
  }
}

function updateLine() {
  if (polyline !== null) polyline.remove()

  polyline = createLine(
    [userCoords.lat, userCoords.lng],
    [productCoords.lat, productCoords.lng]
  )
  polyline.addTo(map)
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

function manageWebsocketConnection(interval) {
  websocket = new WebSocket('ws://localhost:5679/')

  websocket.addEventListener('open', () => {
    console.log('Conectado ao servidor!')
    websocket.send(JSON.stringify({ type: 'select_product' }))
    if (productId) {
      websocket.send(
        JSON.stringify({
          type: 'tracker',
          product_id: productId,
        })
      )
      simulateButton.style.display = 'inline-block'
    }
    nullProducts.remove()
  })

  websocket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.lat && message.lng) {
      productCoords.lat = message.lat
      productCoords.lng = message.lng
      isSimulating = message.isSimulating

      const productName = message.name
      // garante que os marcadores e linhas serão exibidas com as informações de localização do usuario
      updateMap()

      // se marcador não existir, cria e seta coordenadas. Se existir, só atualiza as coordenadas
      productMarker = productMarker
        ? productMarker.setLatLng([productCoords.lat, productCoords.lng])
        : L.marker([productCoords.lat, productCoords.lng]).addTo(map)

      if (productName) {
        productMarker
          .bindTooltip(`Seu produto: ${productName}`, { permanent: true })
          .openTooltip()
      }

      isSimulating
        ? (simulateButton.disabled = true)
        : (simulateButton.disabled = false)
    } else {
      clientsContainer.innerHTML = ''

      const id_list = message.id_list
      const names_list = message.names_list
      for (const index in id_list) {
        const id = id_list[index]
        const name = names_list[index]
        clientsContainer.appendChild(createClient(id, name))
      }
    }
  }

  websocket.addEventListener('close', () => {
    console.warn('Conexão perdida. Tentando reconectar...')
    isSimulating = false
    setTimeout(manageWebsocketConnection, interval)
  })

  websocket.addEventListener('error', (err) => {
    console.error('Erro no WebSocket:', err)
    websocket.close() // força fechamento e reconexão controlada
  })
}

// pega localização do usuario
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude
    // ajusta o mapa e marcador para posição atual
    userCoords.lat = lat
    userCoords.lng = lng

    map.setView([lat, lng], 13)
    userMarker = L.marker([lat, lng]).addTo(map)
    userMarker.bindTooltip('Você', { permanent: true }).openTooltip()
  })
}

simulateButton.addEventListener('click', () => {
  if (websocket.readyState === websocket.OPEN) {
    simulateMovement(10)
    simulateButton.disabled = true
    isSimulating = true
    websocket.send(JSON.stringify({ isSimulating: 1 }))
  }
})

simulateButton.style.display = 'none'

manageWebsocketConnection(RECONNECT_INTERVAL)
