class Product:
    def __init__(self, name, status, lat, lng, websocket=None):
        self.name = name
        self.status = status
        self.lat = lat
        self.lng = lng
        self.websocket = websocket
        self.trackers_connected = set()
