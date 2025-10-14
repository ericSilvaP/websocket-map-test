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

document.addEventListener('DOMContentLoaded', () => {
  const clientsContainer = document.querySelector('.clients-container')
  clientsContainer.appendChild(createClient())
})
