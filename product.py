class Product:
    def __init__(self, name, status, lat, lng, websocket=None):
        self.name = name
        self.status = status
        self.lat = lat
        self.lng = lng
        self.original_lat = lat
        self.original_lng = lng
        self.websocket = websocket
        self.trackers_connected = set()
        self.isSimulating = 0
        self.websocket = None

    def was_moved(self):
        return self.lat != self.original_lat or self.lng != self.original_lng

    def reset_coords(self):
        self.lat = self.original_lat
        self.lng = self.original_lng
