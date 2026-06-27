import AudioFileIcon from "../icons/AudioFileIcon";
import type { Attachment } from "../types/message";

export default function AudioAttachment({
  attachment,
}: {
  attachment: Attachment;
}) {
  return (
    <div
      className="flex flex-row w-full md:w-96 gap-1 bg-surface border-2 border-stroke rounded-lg pl-1 pr-4 py-2"
      key={`file_${attachment.id}`}
    >
      <AudioFileIcon className="text-text h-12 w-12 object-contain shrink-0" />
      <div className="flex flex-col w-full">
        <span className="text-brand-pink truncate w-full decoration-0">
          {attachment.file_name}
        </span>
        <span className="decoration-0 text-text font-normal text-sm">
          {(attachment.file_size / 1000 / 1000).toFixed(2)}
          MB
        </span>
        <audio
          className="w-full"
          controls
          src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url}`}
        />
      </div>
    </div>
  );
}
