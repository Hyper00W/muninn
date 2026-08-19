interface MuninnLogoProps {
  size?: "sm" | "md";
  showTagline?: boolean;
}

export function MuninnLogo({ size = "md", showTagline = true }: MuninnLogoProps) {
  const iconSize = size === "sm" ? 20 : 24;

  return (
    <div className="flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 3C10 5 8 6 6 8C4 10 3 12 3 14C3 17 5 19 7 20C8 21 10 21 12 20C14 21 16 21 17 20C19 19 21 17 21 14C21 12 20 10 18 8C16 6 14 5 12 3Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M8 10C8 10 9 8 12 8C15 8 16 10 16 10"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="12" r="0.8" fill="currentColor" />
        <circle cx="14" cy="12" r="0.8" fill="currentColor" />
        <path
          d="M12 14V17M10 16H14"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M5 6L7 4M19 6L17 4"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <div>
        <div
          className={`font-medium tracking-[0.2em] text-muninn-white ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          MUNINN
        </div>
        {showTagline && (
          <div className="text-[10px] tracking-[0.15em] text-muninn-muted">
            AI DUE DILIGENCE COPILOT
          </div>
        )}
      </div>
    </div>
  );
}
