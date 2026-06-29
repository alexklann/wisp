import type { ReactNode } from "react";
import CloseIcon from "../../icons/CloseIcon";
import { useUIStore } from "../../stores/useUIStore";
import { twMerge } from "tailwind-merge";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Modal({ children, className }: Props) {
  const closeModal = useUIStore((state) => state.closeModal);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={twMerge(
        "relative flex flex-col gap-2 bg-surface-base border border-stroke rounded-lg p-4 text-white min-w-xl min-h-48",
        className,
      )}
    >
      <button
        title="Close Modal"
        className="absolute top-0 right-0 p-2 cursor-pointer"
        onClick={() => closeModal()}
      >
        <CloseIcon className="text-white" />
      </button>
      {children}
    </div>
  );
}
