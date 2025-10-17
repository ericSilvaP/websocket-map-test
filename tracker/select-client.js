const websocket = new WebSocket('ws://localhost:5679/')

function createClient() {
  const clientElement = document.createElement('div')
  const clientLink = document.createElement('a')

  clientElement.classList.add('client')
  clientLink.href = '#'
  clientLink.classList.add('client-link')
  clientLink.textContent = 'Selecionar cliente'
  clientElement.appendChild(clientLink)
  return clientElement
}

websocket.addEventListener('open', () => {
  websocket.send(JSON.stringify({ type: 'tracker', action: 'get_senders' }))
})

// websocket.onmessage = ({ data }) => {
//   const data = JSON.parse(data)
//   alert(data.senders)
// }

document.addEventListener('DOMContentLoaded', () => {
  const clientsContainer = document.querySelector('.clients-container')

  clientsContainer.appendChild(createClient())
  clientsContainer.appendChild(createClient())
  clientsContainer.appendChild(createClient())
})
