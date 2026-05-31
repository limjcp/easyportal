import { FormEvent, useEffect, useRef, useState } from "react";
import { residentRepo } from "../resident/data/mockRepository";
import type { ResidentProfileDetails } from "../resident/data/types";

type MvpCondosChatbotProps = {
  open: boolean;
  onClose: () => void;
};

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  text: string;
};

type FlowState =
  | {
      type: "vehicle";
      step: "make" | "model" | "year" | "plate" | "color" | "confirm";
      draft: {
        make: string;
        model: string;
        year: string;
        plate: string;
        color: string;
      };
    }
  | {
      type: "birthday";
      step: "month" | "day";
      draft: { month?: number };
    }
  | null;

const starterPrompts = [
  "Register my vehicle",
  "Update my birthday",
  "Complete my profile",
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "bot",
    text: "Hi, I am your MVPCondos personal assistant. I can answer questions and complete tasks like vehicle registration and profile updates for you.",
  },
];

function buildBotReply(input: string) {
  const normalized = input.toLowerCase();

  if (
    normalized.includes("maintenance") ||
    normalized.includes("service request") ||
    normalized.includes("work order") ||
    normalized.includes("repair")
  ) {
    return "Go to your portal's requests or maintenance area, create a new request, add details, and submit. Include location and photos when available for faster handling.";
  }

  if (
    normalized.includes("invoice") ||
    normalized.includes("payment") ||
    normalized.includes("bill")
  ) {
    return "Open the invoices or finance section in your portal to review balances and status. You can usually filter by month or status to find the item quickly.";
  }

  if (
    normalized.includes("announcement") ||
    normalized.includes("notice") ||
    normalized.includes("news")
  ) {
    return "Announcements are in the communication or home area depending on your role. Check the latest notices section first for building updates.";
  }

  if (normalized.includes("message") || normalized.includes("chat")) {
    return "Use the chat/messages area to contact building staff, management, or vendors based on your account role. Keep each topic in a separate thread for clarity.";
  }

  if (
    normalized.includes("admin") ||
    normalized.includes("resident") ||
    normalized.includes("company") ||
    normalized.includes("vendor") ||
    normalized.includes("portal")
  ) {
    return "This app has role-based portals. Residents handle day-to-day requests, admins manage operations, company users oversee buildings, and vendors handle assigned tasks.";
  }

  if (
    normalized.includes("login") ||
    normalized.includes("password") ||
    normalized.includes("account")
  ) {
    return "For account access issues, use the login help flow first. If access is still blocked, contact support@mvpcondos.com with your role and building details.";
  }

  if (normalized.includes("how") || normalized.includes("start") || normalized.includes("work")) {
    return "Start from your dashboard, then use the top navigation to open requests, communication, billing, or chat. Each portal shows tools relevant to your role.";
  }

  return "I can help with app navigation, vehicle registration, birthday updates, and profile completion. Try: 'register my vehicle' or 'complete my profile'.";
}

export function MvpCondosChatbot({ open, onClose }: MvpCondosChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flow, setFlow] = useState<FlowState>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef(2);
  const timeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const launcher = document.getElementById("mvpcondos-chatbot-launcher");
      if (panelRef.current?.contains(target)) return;
      if (launcher?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const run = async () => {
      const [user, details] = await Promise.all([residentRepo.getUser(), residentRepo.getResidentDetails()]);
      if (!active) return;
      const today = new Date();
      if (user.birthMonth === today.getMonth() + 1 && user.birthDay === today.getDate()) {
        pushBotMessage(`Happy Birthday, ${user.name}! Wishing you a wonderful day from MVPCondos.`);
      }
      const missing: string[] = [];
      if (!user.phone?.trim()) missing.push("phone number");
      if (!user.birthMonth || !user.birthDay) missing.push("birthday (month/day)");
      if (!details.vehicles.length) missing.push("vehicle details");
      if (missing.length > 0) {
        pushBotMessage(`I can help complete your profile. Missing: ${missing.join(", ")}. Say "complete my profile".`);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [open]);

  const pushBotMessage = (text: string) => {
    const botMessage: ChatMessage = {
      id: nextIdRef.current++,
      role: "bot",
      text,
    };
    setMessages((previous) => [...previous, botMessage]);
  };

  const startVehicleFlow = () => {
    setFlow({
      type: "vehicle",
      step: "make",
      draft: { make: "", model: "", year: "", plate: "", color: "" },
    });
    pushBotMessage("Great, I can register your vehicle now. What is the vehicle make?");
  };

  const startBirthdayFlow = () => {
    setFlow({ type: "birthday", step: "month", draft: {} });
    pushBotMessage("Sure, I can save your birthday. What month were you born? (1-12)");
  };

  const startProfileFlow = async () => {
    const [user, details] = await Promise.all([residentRepo.getUser(), residentRepo.getResidentDetails()]);
    if (!user.birthMonth || !user.birthDay) {
      startBirthdayFlow();
      return;
    }
    if (!details.vehicles.length) {
      startVehicleFlow();
      return;
    }
    pushBotMessage("Your profile already looks complete. You can still ask me to register another vehicle.");
  };

  const saveVehicle = async (vehicle: {
    make: string;
    model: string;
    year: string;
    plate: string;
    color: string;
  }) => {
    const details = await residentRepo.getResidentDetails();
    const existing = details.vehicles.slice(0, 1);
    const nextVehicles = [
      ...existing,
      { id: String(Date.now()), ...vehicle },
    ] as ResidentProfileDetails["vehicles"];
    await residentRepo.updateResidentDetailSection("vehicles", nextVehicles);
  };

  const handleFlowMessage = async (text: string) => {
    if (!flow) return false;
    if (flow.type === "vehicle") {
      const value = text.trim();
      if (!value) {
        pushBotMessage("Please provide a value so I can continue.");
        return true;
      }
      if (flow.step === "make") {
        setFlow({ ...flow, step: "model", draft: { ...flow.draft, make: value } });
        pushBotMessage("Got it. What is the model?");
        return true;
      }
      if (flow.step === "model") {
        setFlow({ ...flow, step: "year", draft: { ...flow.draft, model: value } });
        pushBotMessage("Thanks. What is the year?");
        return true;
      }
      if (flow.step === "year") {
        setFlow({ ...flow, step: "plate", draft: { ...flow.draft, year: value } });
        pushBotMessage("Perfect. What is the license plate?");
        return true;
      }
      if (flow.step === "plate") {
        setFlow({ ...flow, step: "color", draft: { ...flow.draft, plate: value } });
        pushBotMessage("Almost done. What is the vehicle color?");
        return true;
      }
      if (flow.step === "color") {
        const draftVehicle = { ...flow.draft, color: value };
        setFlow({ ...flow, step: "confirm", draft: draftVehicle });
        pushBotMessage(
          `Please confirm: ${draftVehicle.year} ${draftVehicle.make} ${draftVehicle.model}, plate ${draftVehicle.plate}, color ${draftVehicle.color}. Reply "yes" to save.`
        );
        return true;
      }
      if (flow.step === "confirm") {
        if (value.toLowerCase() === "yes") {
          await saveVehicle(flow.draft);
          pushBotMessage("Done. I have registered your vehicle for you.");
          setFlow(null);
        } else {
          pushBotMessage("No problem. Vehicle registration cancelled.");
          setFlow(null);
        }
        return true;
      }
    }

    if (flow.type === "birthday") {
      const value = text.trim();
      const numeric = Number(value);
      if (flow.step === "month") {
        if (!Number.isInteger(numeric) || numeric < 1 || numeric > 12) {
          pushBotMessage("Please enter a valid month from 1 to 12.");
          return true;
        }
        setFlow({ type: "birthday", step: "day", draft: { month: numeric } });
        pushBotMessage("Great. What day of the month? (1-31)");
        return true;
      }
      if (flow.step === "day") {
        if (!Number.isInteger(numeric) || numeric < 1 || numeric > 31 || !flow.draft.month) {
          pushBotMessage("Please enter a valid day from 1 to 31.");
          return true;
        }
        await residentRepo.updateUserProfile({ birthMonth: flow.draft.month, birthDay: numeric });
        pushBotMessage("Saved. Your birthday month/day has been updated.");
        setFlow(null);
        return true;
      }
    }

    return false;
  };

  const sendMessage = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: nextIdRef.current++, role: "user", text };
    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setIsTyping(true);

    const timeoutId = window.setTimeout(async () => {
      const handledByFlow = await handleFlowMessage(text);
      if (!handledByFlow) {
        const normalized = text.toLowerCase();
        if (normalized.includes("register") && normalized.includes("vehicle")) {
          startVehicleFlow();
        } else if (normalized.includes("birthday")) {
          startBirthdayFlow();
        } else if (normalized.includes("complete my profile") || normalized.includes("missing profile")) {
          await startProfileFlow();
        } else {
          pushBotMessage(buildBotReply(text));
        }
      }
      setIsTyping(false);
    }, 500);

    timeoutIdsRef.current.push(timeoutId);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  if (!open) return null;

  return (
    <section
      id="mvpcondos-chatbot-panel"
      aria-label="MVPCondos chatbot panel"
      ref={panelRef}
      className="fixed bottom-24 right-5 z-[60] w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between bg-[#7d5aae] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">MVPCondos Chatbot</p>
          <p className="text-xs text-white/80">Personal assistant</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-sm text-white/90 transition hover:bg-white/15 hover:text-white"
        >
          Close
        </button>
      </header>

      <div className="h-80 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-auto bg-[#3476ef] text-white"
                : "mr-auto border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {message.text}
          </div>
        ))}
        {isTyping && (
          <div className="mr-auto max-w-[85%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            Typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-3 py-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 transition hover:border-[#7d5aae] hover:text-[#7d5aae]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask how the app works..."
            className="h-10 flex-1 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#7d5aae]"
          />
          <button
            type="submit"
            className="h-10 rounded bg-[#7d5aae] px-4 text-sm font-semibold text-white transition hover:bg-[#6f4fa0]"
          >
            Send
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">
          MVPCondos assistant can guide forms and save your details.
        </p>
      </div>
    </section>
  );
}
