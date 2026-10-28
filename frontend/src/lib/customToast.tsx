import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export function showGenericToast({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  toast.custom((t) => (
    <div
      className={twMerge(
        "flex flex-col w-72 bg-surface border-stroke border rounded-md text-white p-2",
        t.visible ? "animate-fade-zoom-in" : "animate-fade-zoom-out",
      )}
    >
      <span className="font-bold">{title}</span>
      <span className="text-white/50 text-xs">{description}</span>
    </div>
  ));
}
