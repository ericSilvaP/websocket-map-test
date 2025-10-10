import asyncio
import json
from websockets.asyncio.server import serve, broadcast

USERS = {
    "trackers": set(),
    "senders": set(),
}
TRACKERS = set()
SENDERS = set()


async def handler(websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            print(data)

            if data.get("type") == "sender":
                USERS["senders"].add(websocket)
                print("Sender connected!")
                continue

            if data.get("type") == "tracker":
                USERS["trackers"].add(websocket)
                print("Tracker connected!")
                continue

            if data.get("lat") and data.get("lng"):
                print("Sended coord!", data)
                broadcast(USERS["trackers"], json.dumps(data))
    finally:
        # Remove conexão ao desconectar
        USERS["senders"].discard(websocket)
        USERS["trackers"].discard(websocket)


async def main():
    async with serve(handler, "localhost", 5679) as server:
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
