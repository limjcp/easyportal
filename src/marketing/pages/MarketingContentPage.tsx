import { SectionBlock } from "../components/SectionBlock";
import type { MarketingAction, MarketingPageContent } from "../data/pageContent/types";
import { FaStar } from "react-icons/fa";

type MarketingContentPageProps = {
  content: MarketingPageContent;
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

function ActionButton({ action, onNavigate }: { action: MarketingAction; onNavigate: (path: string) => void }) {
  const base =
    action.variant === "secondary"
      ? "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      : "rounded-full bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d68cf]";

  if (isExternal(action.href)) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={base}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" className={base} onClick={() => onNavigate(action.href)}>
      {action.label}
    </button>
  );
}

export function MarketingContentPage({ content, onNavigate }: MarketingContentPageProps) {
  return (
    <div className="space-y-8">
      <SectionBlock title={content.pageTitle} subtitle={content.pageIntro}>
        {content.blocks.map((block, index) => {
          if (block.kind === "hero") {
            return (
              <div key={`${block.kind}-${index}`} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  {block.eyebrow && (
                    <p className="mb-3 inline-flex rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1f4db8]">
                      {block.eyebrow}
                    </p>
                  )}
                  <h3 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{block.title}</h3>
                  <p className="mt-3 max-w-2xl text-base text-slate-600">{block.subtitle}</p>
                  {block.actions && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {block.actions.map((action) => (
                        <ActionButton key={`${action.label}-${action.href}`} action={action} onNavigate={onNavigate} />
                      ))}
                    </div>
                  )}
                </div>
                {block.imageUrl && (
                  <img
                    src={block.imageUrl}
                    alt={block.imageAlt ?? "MVP Condos"}
                    className="h-full w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
                  />
                )}
              </div>
            );
          }
          if (block.kind === "section") {
            return (
              <div key={`${block.kind}-${index}`}>
                <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                {block.subtitle && <p className="mt-1 text-sm text-slate-600">{block.subtitle}</p>}
                {block.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
                {block.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-700">
                    {block.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }
          if (block.kind === "feature-grid") {
            return (
              <div key={`${block.kind}-${index}`}>
                <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                {block.subtitle && <p className="mt-1 text-sm text-slate-600">{block.subtitle}</p>}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {block.items.map((item) => (
                    <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-700">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            );
          }
          if (block.kind === "faq") {
            return (
              <div key={`${block.kind}-${index}`}>
                <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                {block.subtitle && <p className="mt-1 text-sm text-slate-600">{block.subtitle}</p>}
                <div className="mt-4 space-y-3">
                  {block.items.map((item) => (
                    <details key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{item.question}</summary>
                      <p className="mt-3 text-sm text-slate-700">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            );
          }
          if (block.kind === "testimonial-grid") {
            return (
              <div key={`${block.kind}-${index}`}>
                <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                {block.subtitle && <p className="mt-1 text-sm text-slate-600">{block.subtitle}</p>}
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {block.items.map((item) => (
                    <article key={`${item.author}-${item.role}`} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex text-[#f59e0b]">
                        {Array.from({ length: item.rating ?? 5 }).map((_, starIndex) => (
                          <FaStar key={`${item.author}-${starIndex}`} />
                        ))}
                      </div>
                      <p className="text-sm italic text-slate-700">"{item.quote}"</p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{item.author}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </article>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={`${block.kind}-${index}`} className="rounded-2xl border border-[#d6e4ff] bg-[#eef4ff] p-5">
              <h3 className="text-lg font-semibold text-[#1f4db8]">{block.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{block.text}</p>
              <div className="mt-3">
                <ActionButton action={block.action} onNavigate={onNavigate} />
              </div>
            </div>
          );
        })}
      </SectionBlock>
    </div>
  );
}

