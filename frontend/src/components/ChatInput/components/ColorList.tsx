import MESSAGE_CONTEXT_COLORS from "@/lib/contextColors";
import { useUIStore } from "@/stores/useUIStore";
import type { Dispatch, SetStateAction } from "react";

interface ContextListProps {
  showColorList: boolean;
  setShowColorList: Dispatch<SetStateAction<boolean>>;
}

export default function ColorList({
  showColorList,
  setShowColorList,
}: ContextListProps) {
  const setCurrentMessageContext = useUIStore(
    (state) => state.setCurrentMessageContext,
  );

  if (!showColorList) return null;

  return (
    <div className="flex flex-row gap-1 absolute bottom-full mb-1 left-0 w-max h-fit bg-surface-base border border-stroke rounded-md p-1">
      <button
        title="Change Context"
        className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer p-2"
        onClick={() => {
          setCurrentMessageContext(0);
          setShowColorList(false);
        }}
      >
        <div
          className="w-full h-full border-2 border-stroke rounded-full"
          style={{ backgroundColor: MESSAGE_CONTEXT_COLORS[0] }}
        ></div>
      </button>
      <button
        title="Change Context"
        className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer p-2"
        onClick={() => {
          setCurrentMessageContext(1);
          setShowColorList(false);
        }}
      >
        <div
          className="w-full h-full border-2 border-stroke rounded-full"
          style={{ backgroundColor: MESSAGE_CONTEXT_COLORS[1] }}
        ></div>
      </button>
      <button
        title="Change Context"
        className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer p-2"
        onClick={() => {
          setCurrentMessageContext(2);
          setShowColorList(false);
        }}
      >
        <div
          className="w-full h-full border-2 border-stroke rounded-full"
          style={{ backgroundColor: MESSAGE_CONTEXT_COLORS[2] }}
        ></div>
      </button>
      <button
        title="Change Context"
        className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer p-2"
        onClick={() => {
          setCurrentMessageContext(3);
          setShowColorList(false);
        }}
      >
        <div
          className="w-full h-full border-2 border-stroke rounded-full"
          style={{ backgroundColor: MESSAGE_CONTEXT_COLORS[3] }}
        ></div>
      </button>
    </div>
  );
}
