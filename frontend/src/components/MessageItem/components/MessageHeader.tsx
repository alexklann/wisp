import MessageAvatar from "./MessageAvatar";

interface Props {
  avatarUrl: string | null;
  displayName: string;
  createdAt: number;
  editedAt: number;
  isConsecutive: boolean;
}

// Return timestamp in HH:MM format
const time = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function formatTimestamp(timestamp: number): string {
  const message_date = new Date(timestamp);
  const now = new Date();

  const isToday = message_date.toDateString() === now.toDateString();
  if (isToday) {
    return time(timestamp);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (message_date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time(timestamp)}`;
  }

  const doubleDigitDay = String(message_date.getDate()).padStart(2, "0");
  const doubleDigitMonth = String(message_date.getMonth() + 1).padStart(2, "0");
  const doubleDigitYear = String(message_date.getFullYear())
    .slice(-2)
    .padStart(2, "0");

  return `${doubleDigitDay}.${doubleDigitMonth}.${doubleDigitYear}, ${time(timestamp)}`;
}

export default function MessageHeader({
  avatarUrl,
  displayName,
  createdAt,
  editedAt,
  isConsecutive,
}: Props) {
  if (isConsecutive) return;

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-2">
        <MessageAvatar avatarUrl={avatarUrl} />
        <div className="flex flex-col items-baseline">
          <span className="font-bold">{displayName}</span>
          <div className="flex flex-row gap-1 text-text/50 text-xs">
            <span title={new Date(createdAt).toLocaleString()}>
              {formatTimestamp(createdAt)}
            </span>
            {editedAt !== null && (
              <span title={new Date(editedAt).toLocaleString()}>(edited)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
