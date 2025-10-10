const websocket = new WebSocket('ws://localhost:5679/')

websocket.addEventListener('open', () => {
  // connect sender
  websocket.send(JSON.stringify({ type: 'sender' }))

  // send coordinates to server
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition((pos) => {
      websocket.send(
        JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      )
    })
  }
})
