let websocket = null
const nullProducts = document.getElementById('nullProduct')
const clientsContainer = document.querySelector('.clients-container')
const RECONNECT_INTERVAL = 2000


function initMap() {
  map = L.map('map').setView([-2.90472, -41.7767], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}


function createClient(id, name = '') {
  const clientElement = document.createElement('div')
  const clientLink = document.createElement('a')

  clientElement.classList.add('client')
  clientLink.href = `tracker.html?id=${id}`
  clientLink.classList.add('client-link')

  if (!name) {
    clientLink.textContent = `Selecionar cliente - ${id}`
  } else {
    clientLink.textContent = `${name}`
  }

  clientElement.appendChild(clientLink)
  return clientElement
}


function manageWebsocketConnection(interval) {
  websocket = new WebSocket('ws://localhost:5679/')

  websocket.addEventListener('open', () => {
    console.log('Conectado ao servidor!')
    websocket.send(JSON.stringify({ type: 'select_product' }))
    nullProducts.remove();  
  })

  websocket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    clientsContainer.innerHTML = ''

    const id_list = message.id_list
    const names_list = message.names_list
    for (const index in id_list) {
      const id = id_list[index]
      const name = names_list[index]
      clientsContainer.appendChild(createClient(id, name))
    }
  }

  websocket.addEventListener('close', () => {
    console.warn('Conexão perdida. Tentando reconectar...')
    setTimeout(manageWebsocketConnection, interval)
  })

  websocket.addEventListener('error', (err) => {
    console.error('Erro no WebSocket:', err)
    websocket.close() // força fechamento e reconexão controlada
  })
}

initMap();
manageWebsocketConnection(RECONNECT_INTERVAL)
