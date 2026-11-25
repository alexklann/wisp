export default function PlusIcon({ className }: { className: string | null }) {
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
        d="M19.0588 11.0588H12.9412V4.94118C12.9412 4.42165 12.5195 4 12 4C11.4805 4 11.0588 4.42165 11.0588 4.94118V11.0588H4.94118C4.42165 11.0588 4 11.4805 4 12C4 12.5195 4.42165 12.9412 4.94118 12.9412H11.0588V19.0588C11.0588 19.5784 11.4805 20 12 20C12.5195 20 12.9412 19.5784 12.9412 19.0588V12.9412H19.0588C19.5784 12.9412 20 12.5195 20 12C20 11.4805 19.5784 11.0588 19.0588 11.0588Z"
        fill="currentColor"
      />
    </svg>
  );
}
