import asyncio
import json
from websockets.asyncio.server import serve, broadcast

USERS = set()
LAT = 0
LNG = 0


async def coordinate_manager(websocket):
    global USERS, LAT, LNG
    try:
        # Register user
        USERS.add(websocket)
        await websocket.send(json.dumps({"lat": LAT, "lgt": LNG}))

        # receive messages and update lat and lgt for all connections
        async for message in websocket:
            event = json.loads(message)
            LAT = event["lat"]
            LNG = event["lgt"]
            broadcast(USERS, json.dumps({"lat": event["lat"], "lgt": event["lgt"]}))
    finally:
        # Unregister user
        USERS.remove(websocket)


async def main():
    async with serve(coordinate_manager, "localhost", 5678) as server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
