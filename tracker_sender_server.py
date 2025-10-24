import asyncio
import json
from websockets.asyncio.server import serve, broadcast

from product import Product

TRACKERS = set()
SELECT_PRODUCT = set()
PRODUCTS = [
    Product("Celular", "on_hold", -2.9092655546820363, -41.74681843324229),
    Product("Televisão", "on_hold", -5.0710213079834725, -42.77375251180977),
    Product("Conjunto de Camisas", "on_hold", -3.175940226775172, -41.86812830662907),
]
PRODUCTS_WB = set()


def getProductsIndex():
    return list(range(len(PRODUCTS)))


def updateSelectList():
    products_index_list = getProductsIndex()
    products_name = [product.name for product in PRODUCTS if type(product) == Product]
    if products_index_list:
        broadcast(
            SELECT_PRODUCT,
            json.dumps(
                {
                    "id_list": products_index_list,
                    "names_list": products_name,
                }
            ),
        )
        print("Products list sended:", products_index_list, "\n")
    else:
        print("No active senders.\n")


class Sender:
    def __init__(self, websocket):
        self.websocket = websocket
        self.trackers_connected = set()


async def handler(websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            product_id = None
            print(data)

            if data.get("type") == "product":
                # conecta quem envia localização
                sender_instance = Sender(websocket)
                PRODUCTS.append(sender_instance)
                PRODUCTS_WB.add(websocket)
                print(f"Sender number {len(PRODUCTS)} connected!\n")

                # atualiza a lista de conexões
                updateSelectList()
                continue

            if data.get("type") == "select_product":
                # conecta quem seleciona o produto
                SELECT_PRODUCT.add(websocket)
                print(f"Selecter number {len(PRODUCTS)} connected!\n")
                # atualiza a lista de conexões
                updateSelectList()
                continue

            if data.get("type") == "tracker":
                # conecta quem recebe localização
                TRACKERS.add(websocket)
                print("Tracker connected!\n")

                # liga rastreador e rastreado
                try:
                    product_id = int(data.get("product_id"))
                    if product_id in list(range(len(PRODUCTS))):
                        product = PRODUCTS[product_id]
                        product.trackers_connected.add(websocket)
                        print(f"tracker connected to the sender {product_id}\n")

                        await websocket.send(
                            json.dumps({"lat": product.lat, "lng": product.lng})
                        )
                except ValueError:
                    print("Error converting id")
                continue

            # pega a localização e compartilha com todos os rastreadores conectados
            if "lat" in data and "lng" in data:
                if "product_id" in data:
                    product_id = int(data.get("product_id"))
                else:
                    try:
                        for i, sender_instance in enumerate(PRODUCTS):
                            if sender_instance.websocket is websocket:
                                product_id = i
                                break
                    except ValueError:
                        print("Sender not connected")
                        continue

                if product_id is not None:
                    product = PRODUCTS[product_id]
                    coords = {
                        "lat": data["lat"],
                        "lng": data["lng"],
                    }
                    print("Broadcasting coords:", coords, "\n")
                    broadcast(product.trackers_connected, json.dumps(coords))
                    product.lat = coords["lat"]
                    product.lng = coords["lng"]
                continue

            if "status" in data and "product_id" in data:
                status = data["status"]
                product_id = int(data["product_id"])
                PRODUCTS[product_id].status = status
                print(PRODUCTS[product_id].status + "\n")
                continue

    finally:
        # Remove conexão ao desconectar
        PRODUCTS_WB.discard(websocket)
        for product in PRODUCTS:
            if product.websocket is websocket:
                PRODUCTS.remove(product)
                updateSelectList()
        TRACKERS.discard(websocket)
        SELECT_PRODUCT.discard(websocket)


async def main():
    async with serve(handler, "localhost", 5679) as server:
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
