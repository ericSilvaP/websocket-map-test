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
  websocket.send(JSON.stringify({ type: 'select_sender' }))
})

websocket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  const senders_id = message.senders
  if (senders_id) {
    clientsContainer.innerHTML = ''
    for (const id of senders_id) {
      clientsContainer.appendChild(createClient(id))
    }
  }
}
