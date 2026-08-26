import json

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.channels: dict[str, set[WebSocket]] = {}
        self.active_users: dict[str, set[WebSocket]] = {}

    def connect_user(self, user_id: str, websocket: WebSocket):
        if user_id not in self.active_users:
            self.active_users[user_id] = set()
        self.active_users[user_id].add(websocket)

    def disconnect_user(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_users:
            self.active_users[user_id].discard(websocket)
            if not self.active_users[user_id]:
                del self.active_users[user_id]

    def is_user_online(self, user_id: str):
        return user_id in self.active_users and len(self.active_users[user_id]) > 0

    def join_channel(self, websocket: WebSocket, channel_id: str):
        if channel_id not in self.channels:
            self.channels[channel_id] = set()
        self.channels[channel_id].add(websocket)

    def leave_channel(self, websocket: WebSocket, channel_id: str):
        if channel_id in self.channels:
            self.channels[channel_id].discard(websocket)
            if not self.channels[channel_id]:
                del self.channels[channel_id]

    async def broadcast(self, channel_id: str, message: dict):
        if channel_id in self.channels:
            dead_sockets = set()
            for connection in self.channels[channel_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(connection)

            for socket in dead_sockets:
                self.leave_channel(socket, channel_id)


manager = ConnectionManager()


def get_connection_manager() -> ConnectionManager:
    return manager
