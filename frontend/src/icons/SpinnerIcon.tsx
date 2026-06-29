export default function SpinnerIcon({
  className,
}: {
  className: string | null;
}) {
  return (
    <svg
      className={className || ""}
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.15941 12C5.15945 15.7779 8.22211 18.8406 12 18.8406C15.7779 18.8405 18.8405 15.7779 18.8406 12C18.8406 8.22211 15.7779 5.15945 12 5.15941V4C16.4182 4.00004 20 7.58179 20 12C20 16.4182 16.4182 20 12 20C7.58179 20 4.00004 16.4182 4 12H5.15941Z"
        fill="currentColor"
      />
    </svg>
  );
}
