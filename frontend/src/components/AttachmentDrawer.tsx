interface Props {
  attachments: File[];
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  removeAttachment: (fileNameToRemove: string) => void;
}

export default function AttachmentDrawer({
  attachments,
  isUploading,
  uploadProgress,
  removeAttachment,
}: Props) {
  if (attachments.length === 0) return;

  return (
    <div className="flex flex-row flex-wrap gap-2 bg-background pb-2">
      {attachments.map((file) => (
        <div
          key={file.name}
          className="flex flex-row items-center gap-4 bg-border p-2 rounded-md border border-background"
        >
          <span
            className="text-sm font-bold font-sans-code text-subtitle truncate max-w-37.5"
            title={file.name}
          >
            {file.name}
          </span>
          {isUploading ? (
            <span className="text-sm text-[#FDB8FF]">
              {uploadProgress[file.name] || 0}%
            </span>
          ) : (
            <button
              onClick={() => removeAttachment(file.name)}
              className="text-red-400 hover:text-red-500 font-bold cursor-pointer"
            >
              X
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
