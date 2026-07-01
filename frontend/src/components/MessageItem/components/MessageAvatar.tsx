export default function MessageAvatar({ avatarUrl }: { avatarUrl: string }) {
  return (
    <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
      {avatarUrl && <img className="w-full h-full" src={avatarUrl} />}
    </div>
  );
}
