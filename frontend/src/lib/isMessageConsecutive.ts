import type Message from "../types/message";

export default function isMessageConsecutive(
  current: Message,
  prev?: Message,
): boolean {
  if (!prev) return false;
  const isTimeExceeded =
    new Date(current.created_at).getTime() -
      new Date(prev.created_at).getTime() >=
    5 * 60 * 1000;
  const isDifferentSender = current.sender_id !== prev.sender_id;
  return !isTimeExceeded && !isDifferentSender;
}
