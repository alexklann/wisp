from typing import Literal

from pydantic import BaseModel


class Ping(BaseModel):
    type: Literal["ping"]


class SendMessage(BaseModel):
    type: Literal["sendMessage"]
    channel_id: str
    content: str


class JoinChannel(BaseModel):
    type: Literal["joinChannel"]
    channel_id: str


class TypingStart(BaseModel):
    type: Literal["typingStart"]
    channel_id: str


ClientEvent = Ping | SendMessage | JoinChannel | TypingStart
