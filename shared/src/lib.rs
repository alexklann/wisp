use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ClientEvent {
    Ping,
    SendMessage { channel_id: String, content: String },
    JoinChannel { channel_id: String },
}
