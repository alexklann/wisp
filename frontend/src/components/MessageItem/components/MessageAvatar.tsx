import FileIcon from "../../../icons/FileIcon";
import { twMerge } from "tailwind-merge";

export default function MessageAvatar({ avatarUrl, className }: { avatarUrl: string | null, className?: string | null }) {
  return (
    <div className={
      twMerge(
        "w-10 h-10 bg-white rounded-full overflow-hidden",
        className
      )
    }>
      {avatarUrl ? (
        <img className="w-full h-full" src={avatarUrl} />
      ) : (
        <div className="flex justify-center items-center w-full h-full">
          <FileIcon className="h-[75%] w-[75%] text-black/20" />
        </div>
      )}
    </div>
  );
}
