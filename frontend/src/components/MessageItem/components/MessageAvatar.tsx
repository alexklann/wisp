import type Message from "../../../types/message";

export default function MessageAvatar({ message }: { message: Message }) {
  return (
    <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
      {message.sender_avatar_url && (
        <img className="w-full h-full" src={message.sender_avatar_url} />
      )}
    </div>
  );
}
