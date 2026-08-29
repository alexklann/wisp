import FileIcon from "../../../icons/FileIcon";
import { useUIStore } from "../../../stores/useUIStore";
import type { Attachment } from "../../../types/message";
import AudioAttachment from "../../AudioAttachment";

export default function MessageAttachments({
  messageAttachments,
}: {
  messageAttachments: Attachment[];
}) {
  const setSelectedImageURL = useUIStore((state) => state.setSelectedImageURL);
  const setSelectedImageFilename = useUIStore(
    (state) => state.setSelectedImageFilename,
  );

  if (messageAttachments.length === 0) return <></>;
  return (
    <div className="flex flex-col gap-2">
      {messageAttachments.map((attachment: Attachment) =>
        attachment.file_type.startsWith("image/") ? (
          <img
            onSelect={(event) => event.preventDefault()}
            key={`image_${attachment.id}`}
            onClick={() => {
              setSelectedImageURL(
                `${import.meta.env.VITE_BACKEND_URL}${attachment.url}`,
              );
              setSelectedImageFilename(attachment.id);
            }}
            className="max-w-[90%] md:max-w-72 cursor-pointer rounded-lg"
            src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url.split(".webp")[0]}_thumb.webp`}
          />
        ) : attachment.file_type.startsWith("audio/") ? (
          <AudioAttachment attachment={attachment} />
        ) : attachment.file_type.startsWith("video/") ? (
          <video
            key={`video_${attachment.id}`}
            controls
            className="max-w-full w-full h-72 md:w-fit"
            src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url}`}
            preload="metadata"
          />
        ) : (
          <a
            href={`${import.meta.env.VITE_BACKEND_URL}/download/${attachment.id}`}
            download
            target="_blank"
            title="Download file"
            className="flex flex-row w-full md:w-96 gap-1 bg-surface hover:bg-white/5 border-2 border-stroke rounded-lg pl-1 pr-4 py-2 cursor-pointer overflow-hidden"
            key={`file_${attachment.id}`}
          >
            <FileIcon className="text-text h-12 w-12 object-contain shrink-0" />
            <div className="flex flex-col w-full min-w-0 flex-1">
              <span className="block text-brand-pink truncate w-full decoration-0">
                {attachment.file_name}
              </span>
              <span className="decoration-0 text-text font-normal text-sm">
                {(attachment.file_size / 1000 / 1000).toFixed(2)}
                MB
              </span>
            </div>
          </a>
        ),
      )}
    </div>
  );
}
