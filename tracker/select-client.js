const websocket = new WebSocket('ws://localhost:5679/')
const clientsContainer = document.querySelector('.clients-container')

function createClient(id) {
  const clientElement = document.createElement('div')
  const clientLink = document.createElement('a')

  clientElement.classList.add('client')
  clientLink.href = `tracker.html?id=${id}`
  clientLink.classList.add('client-link')
  clientLink.textContent = 'Selecionar cliente'
  clientElement.appendChild(clientLink)
  return clientElement
}

websocket.addEventListener('open', () => {
  websocket.send(JSON.stringify({ type: 'tracker', action: 'get_senders' }))
})

websocket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  const ids = message.senders
  for (const id of ids) {
    clientsContainer.appendChild(createClient(id))
  }
}
