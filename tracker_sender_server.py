import asyncio
import json
from websockets.asyncio.server import serve, broadcast

TRACKERS = set()
SENDERS = []
senders_wb = set()


class Sender:
    def __init__(self, websocket):
        self.websocket = websocket
        self.trackers_connected = set()


async def handler(websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            sender_id = None
            print(data)

            if data.get("type") == "sender":
                # conecta quem envia localização
                sender_instance = Sender(websocket)
                SENDERS.append(sender_instance)
                senders_wb.add(websocket)
                print(f"Sender number {len(SENDERS)} connected!\n")
                continue

            if data.get("type") == "tracker":
                # conecta quem recebe localização
                TRACKERS.add(websocket)
                print("Tracker connected!\n")

                # obtém ids de todos os rastreados
                if data.get("action") == "get_senders":
                    senders_list = list(range(len(SENDERS)))
                    print("get_senders:" + json.dumps({"senders": senders_list}))
                    if senders_list:
                        await websocket.send(json.dumps({"senders": senders_list}))
                        print("Lista de senders enviada:", senders_list, "\n")
                    else:
                        print("No active senders.\n")

                # liga rastreador e rastreado
                if data.get("action") == "connect_to_sender":
                    sender_id = int(data.get("sender_id"))
                    if sender_id in list(range(len(SENDERS))):
                        sender = SENDERS[sender_id]
                        sender.trackers_connected.add(websocket)
                        print(f" Tracker conectado ao sender {sender_id}\n")
                continue

            # pega a localização e compartilha com todos os rastreadores conectados
            if "lat" in data and "lng" in data and websocket in senders_wb:
                try:
                    for i, sender_instance in enumerate(SENDERS):
                        if sender_instance.websocket is websocket:
                            sender_id = i
                            break
                except ValueError:
                    print("Sender not connected")
                    continue

                if sender_id is not None:
                    payload = {
                        "lat": data["lat"],
                        "lng": data["lng"],
                    }
                    print("Broadcasting coords:", payload, "\n")
                    broadcast(
                        SENDERS[sender_id].trackers_connected, json.dumps(payload)
                    )

    finally:
        # Remove conexão ao desconectar
        senders_wb.discard(websocket)
        for sender in SENDERS:
            if sender.websocket is websocket:
                SENDERS.remove(sender)
        TRACKERS.discard(websocket)


async def main():
    async with serve(handler, "localhost", 5679) as server:
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
