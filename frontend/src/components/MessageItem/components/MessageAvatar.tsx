import FileIcon from "../../../icons/FileIcon";

export default function MessageAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
      {avatarUrl ? (
        <img className="w-full h-full" src={avatarUrl} />
      ) : (
        <div className="flex justify-center items-center w-full h-full">
          <FileIcon className="h-8 w-8 text-black/20" />
        </div>
      )}
    </div>
  );
}
