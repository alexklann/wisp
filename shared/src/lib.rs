use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ClientEvent {
    Ping { content: String },
    SendMessage { room_id: String, content: String },
    JoinRoom { room_id: String },
}
