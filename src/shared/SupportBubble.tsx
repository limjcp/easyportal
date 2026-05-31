type SupportBubbleProps = {
  open: boolean;
  onToggle: () => void;
};

export function SupportBubble({ open, onToggle }: SupportBubbleProps) {
  return (
    <button
      id="mvpcondos-chatbot-launcher"
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close MVPCondos chatbot" : "Open MVPCondos chatbot"}
      aria-expanded={open}
      aria-controls="mvpcondos-chatbot-panel"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#7d5aae] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7d5aae]/30 transition hover:-translate-y-px hover:bg-[#6f4fa0]"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-xs">
        {open ? "x" : "?"}
      </span>
      MVPCondos Chat
    </button>
  );
}
