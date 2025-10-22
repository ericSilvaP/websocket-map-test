let websocket = null
const clientsContainer = document.querySelector('.clients-container')
const RECONNECT_INTERVAL = 2000

function createClient(id, name = '') {
  const clientElement = document.createElement('div')
  const clientLink = document.createElement('a')

  clientElement.classList.add('client')
  clientLink.href = `tracker.html?id=${id}`
  clientLink.classList.add('client-link')

  if (!name) {
    clientLink.textContent = `Selecionar cliente - ${id}`
  } else {
    clientLink.textContent = `${name} - ${id}`
  }

  clientElement.appendChild(clientLink)
  return clientElement
}

function connectWebsocket(interval) {
  websocket = new WebSocket('ws://localhost:5679/')

  websocket.addEventListener('open', () => {
    console.log('✅ Conectado ao servidor!')
    websocket.send(JSON.stringify({ type: 'select_product' }))
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
    console.warn('⚠️ Conexão perdida. Tentando reconectar...')
    setTimeout(connectWebsocket, interval)
  })

  websocket.addEventListener('error', (err) => {
    console.error('❌ Erro no WebSocket:', err)
    websocket.close() // força fechamento e reconexão controlada
  })
}

connectWebsocket(RECONNECT_INTERVAL)
