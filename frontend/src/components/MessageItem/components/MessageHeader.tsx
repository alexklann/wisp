import MessageAvatar from "./MessageAvatar";

interface Props {
  avatarUrl: string | null;
  displayName: string;
  createdAt: number;
  editedAt: number;
  isConsecutive: boolean;
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
    <div className="flex flex-col mb-2">
      <div className="flex flex-row items-center gap-2">
        {avatarUrl && <MessageAvatar avatarUrl={avatarUrl} />}
        <div className="flex flex-col">
          <span className="font-bold">{displayName}</span>
          <div className="flex flex-row gap-1">
            <span className="text-xs">
              {new Date(createdAt).toLocaleString()}
            </span>
            {editedAt !== null && (
              <span
                title={new Date(editedAt).toLocaleString()}
                className="text-xs text-text/50"
              >
                (edited)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
