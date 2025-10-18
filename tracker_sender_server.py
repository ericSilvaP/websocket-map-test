import asyncio
import json
from websockets.asyncio.server import serve, broadcast

TRACKERS = set()
SELECT_SENDER = set()
SENDERS = []
SENDERS_WB = set()


def getSendersId():
    return list(range(len(SENDERS)))


def updateSelectList():
    senders_ids_list = getSendersId()
    if senders_ids_list:
        broadcast(SELECT_SENDER, json.dumps({"senders": senders_ids_list}))
        print("Lista de senders enviada:", senders_ids_list, "\n")
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
            sender_id = None
            print(data)

            if data.get("type") == "sender":
                # conecta quem envia localização
                sender_instance = Sender(websocket)
                SENDERS.append(sender_instance)
                SENDERS_WB.add(websocket)
                print(f"Sender number {len(SENDERS)} connected!\n")

                # atualiza a lista de conexões
                updateSelectList()
                continue

            if data.get("type") == "select_sender":
                # conecta quem seleciona o sender
                SELECT_SENDER.add(websocket)
                print(f"Selecter number {len(SENDERS)} connected!\n")
                # atualiza a lista de conexões
                updateSelectList()
                continue

            if data.get("type") == "tracker":
                # conecta quem recebe localização
                TRACKERS.add(websocket)
                print("Tracker connected!\n")

                # liga rastreador e rastreado
                try:
                    sender_id = int(data.get("sender_id"))
                    if sender_id in list(range(len(SENDERS))):
                        sender = SENDERS[sender_id]
                        sender.trackers_connected.add(websocket)
                        print(f"tracker connected to the sender {sender_id}\n")
                except ValueError:
                    print("Error converting id")
                continue

            # pega a localização e compartilha com todos os rastreadores conectados
            if "lat" in data and "lng" in data and websocket in SENDERS_WB:
                try:
                    for i, sender_instance in enumerate(SENDERS):
                        if sender_instance.websocket is websocket:
                            sender_id = i
                            break
                except ValueError:
                    print("Sender not connected")
                    continue

                if sender_id is not None:
                    coords = {
                        "lat": data["lat"],
                        "lng": data["lng"],
                    }
                    print("Broadcasting coords:", coords, "\n")
                    broadcast(SENDERS[sender_id].trackers_connected, json.dumps(coords))

    finally:
        # Remove conexão ao desconectar
        SENDERS_WB.discard(websocket)
        for sender in SENDERS:
            if sender.websocket is websocket:
                SENDERS.remove(sender)
        TRACKERS.discard(websocket)
        SELECT_SENDER.discard(websocket)

        # atualiza a lista de conexões
        updateSelectList()


async def main():
    async with serve(handler, "localhost", 5679) as server:
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
