import asyncio
import json
from xmlrpc.client import Boolean
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
# REMOVIDO: IS_SIMULATING (usamos o do produto)


def getProductsIndex():
    return list(range(len(PRODUCTS)))


def broadcast_product_coords(product: Product):
    coords = {
        "lat": product.lat,
        "lng": product.lng,
        "name": product.name,
        "isSimulating": product.isSimulating,
        "status": product.status,
    }
    broadcast(product.trackers_connected, json.dumps(coords))


def updateSelectList():
    products_index_list = getProductsIndex()
    # MUDANÇA: Simplificado, pois agora é tudo 'Product'
    products_name = [product.name for product in PRODUCTS]
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


async def handler(websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            product_id = None
            print(data)

            if data.get("type") == "product":
                # conecta quem envia localização
                product_name = data.get("name")
                # Agora o construtor do Product define original_lat/lng para 0
                new_product = Product(product_name, "On_hold", 0, 0)
                new_product.websocket = websocket

                PRODUCTS.append(new_product)
                PRODUCTS_WB.add(websocket)

                print(f"Sender (Produto {len(PRODUCTS)-1}) {product_name} connected!\n")

                # atualiza a lista de conexões
                updateSelectList()
                continue

            if data.get("type") == "select_product":
                # (sem mudança)
                SELECT_PRODUCT.add(websocket)
                print(f"Selecter number {len(SELECT_PRODUCT)} connected!\n")
                updateSelectList()
                continue

            if data.get("type") == "tracker":
                # (sem mudança)
                TRACKERS.add(websocket)
                print("Tracker connected!\n")
                try:
                    product_id = int(data.get("product_id"))
                    if product_id in list(range(len(PRODUCTS))):
                        product = PRODUCTS[product_id]
                        product.trackers_connected.add(websocket)
                        print(f"tracker connected to the sender {product_id}\n")

                        await websocket.send(
                            json.dumps(
                                {
                                    "lat": product.lat,
                                    "lng": product.lng,
                                    "name": product.name,
                                }
                            )
                        )
                except ValueError:
                    print("Error converting id")
                continue

            # pega a localização e compartilha com todos os rastreadores conectados
            if data.get("type") == "updateCoords":
                if "product_id" in data:
                    product_id = int(data.get("product_id"))
                else:
                    try:
                        for i, product in enumerate(PRODUCTS):
                            if product.websocket is websocket:
                                product_id = i
                                break
                    except ValueError:
                        print("Sender not connected")
                        continue

                if product_id is not None:
                    product = PRODUCTS[product_id]

                    # Atualiza a localização ATUAL
                    product.lat = data["lat"]
                    product.lng = data["lng"]

                    product.isSimulating = 1
                    broadcast_product_coords(product)
                    print("Broadcasting coords:", data["lat"], data["lng"], "\n")
                continue

            if data.get("type") == "updateStatus":
                status = data["status"]
                product_id = int(data["product_id"])
                product = PRODUCTS[product_id]
                product.status = status
                product.isSimulating = 0
                broadcast_product_coords(product)
                print("Updated Status", PRODUCTS[product_id].status + "\n")
                continue

            if "isSimulating" in data:
                print("Mensagem 'isSimulating' recebida:", data.get("isSimulating"))

                product_id = None
                if "product_id" in data:
                    product_id = int(data.get("product_id"))
                else:
                    try:
                        for i, product in enumerate(PRODUCTS):
                            if product.websocket is websocket:
                                product_id = i
                                break
                    except ValueError:
                        product_id = None

                if product_id is not None and product_id in range(len(PRODUCTS)):
                    product = PRODUCTS[product_id]
                    new_sim_status = data.get("isSimulating")
                    product.isSimulating = new_sim_status

                    print(
                        f"Produto {product_id} ('{product.name}') simulação: {product.isSimulating}\n"
                    )

                    # NOVO: Se a simulação PAROU (== 0)
                    if new_sim_status == 0:
                        print(f"Resetando {product.name} para local original.")
                        # Restaura a localização atual para a original
                        product.lat = product.original_lat
                        product.lng = product.original_lng

                        # Avisa os trackers que a posição foi resetada
                        coords = {
                            "lat": product.lat,
                            "lng": product.lng,
                            "isSimulating": 0,
                        }
                        broadcast(product.trackers_connected, json.dumps(coords))
                continue

            if data.get("type") == "reset":
                try:
                    product_id = int(data.get("id"))

                    product = PRODUCTS[product_id]
                    if not product.was_moved():
                        print("Product was not moved. Wait until he moves.")
                        continue

                    product.reset_coords()
                    broadcast_product_coords(product)
                    print("Coords reseted", product.lat, product.lng)
                except ValueError:
                    print("Error converting ID - reset")
                finally:
                    continue

    finally:
        # (sem mudança)
        PRODUCTS_WB.discard(websocket)
        product_to_remove = None
        for product in PRODUCTS:
            if product.websocket is websocket:
                product_to_remove = product
                break
        if product_to_remove:
            PRODUCTS.remove(product_to_remove)
            updateSelectList()

        TRACKERS.discard(websocket)
        SELECT_PRODUCT.discard(websocket)


async def main():
    async with serve(handler, "localhost", 5679) as server:
        sockname = list(server.sockets)[0].getsockname()
        host = sockname[0]
        port = sockname[1]
        print(f"🚀 Servidor WebSocket conectado em ws://{host}:{port}")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServidor WebSocket desconectado!")
