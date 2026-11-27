import PaperclipIcon from "@/icons/PaperclipIcon";
import type { Dispatch, SetStateAction } from "react";

interface ContextListProps {
  openFilePicker: () => void;
  showContextList: boolean;
  setShowContextList: Dispatch<SetStateAction<boolean>>;
}

export default function ContextList({
  openFilePicker,
  showContextList,
  setShowContextList,
}: ContextListProps) {
  if (!showContextList) return null;

  return (
    <div className="absolute bottom-full mb-1 left-0 w-max h-fit bg-surface-base border border-stroke rounded-md p-1">
      <button
        onClick={() => {
          openFilePicker();
          setShowContextList(false);
        }}
        className="flex flex-row items-center gap-2 hover:bg-white/5 w-full cursor-pointer rounded-md py-1 px-2"
      >
        <PaperclipIcon className="h-6 w-6" />
        <span>Upload File</span>
      </button>
    </div>
  );
}
