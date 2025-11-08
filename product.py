class Product:
    def __init__(self, name, status, lat, lng, websocket=None):
        self.name = name
        self.status = status
        self.lat = lat
        self.lng = lng
        self.original_lat = lat
        self.original_lng = lng
        self.has_set_original = (lat != 0 or lng != 0)
        self.websocket = websocket
        self.trackers_connected = set()

        self.isSimulating = 0
        self.websocket = None
