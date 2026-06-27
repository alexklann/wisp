import { twMerge } from "tailwind-merge";

export default function BaseActionButton({
  children,
  title,
  onClick,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      className={twMerge(
        "flex items-center justify-center h-10 aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
