import type { MarketingPageContent } from "../data/pageContent/types";
import { DEFAULT_HERO_IMAGE } from "../constants";
import { EDITORIAL_CONTAINER, EDITORIAL_PROSE, EDITORIAL_SECTION_PY } from "../editorialLayout";
import { EditorialRichText } from "../components/EditorialRichText";
import { ScrollReveal } from "../components/ScrollReveal";
import { pe } from "../typography";
import { ApproachGridSection } from "../components/home/ApproachGridSection";
import { CtaBandSection } from "../components/home/CtaBandSection";
import { FaqSection } from "../components/home/FaqSection";
import { HeroSection } from "../components/home/HeroSection";
import { PageHeaderSection } from "../components/home/PageHeaderSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import { TextSection } from "../components/home/TextSection";

type EditorialContentPageProps = {
  content: MarketingPageContent;
  onNavigate: (path: string) => void;
  hidePageHeader?: boolean;
};

export function EditorialContentPage({ content, onNavigate, hidePageHeader = false }: EditorialContentPageProps) {
  const firstBlock = content.blocks[0];
  const startsWithHero = firstBlock?.kind === "hero";
  const remainingBlocks = startsWithHero ? content.blocks.slice(1) : content.blocks;

  return (
    <>
      {startsWithHero && firstBlock.kind === "hero" && (
        <HeroSection
          eyebrow={firstBlock.eyebrow}
          title={firstBlock.title}
          subtitle={firstBlock.subtitle}
          imageUrl={firstBlock.imageUrl ?? DEFAULT_HERO_IMAGE}
          imageAlt={firstBlock.imageAlt}
          actions={firstBlock.actions}
          onNavigate={onNavigate}
        />
      )}

      {!startsWithHero && !hidePageHeader && (
        <PageHeaderSection
          eyebrow={content.pageEyebrow}
          title={content.pageTitle}
          intro={content.pageIntro}
          actions={content.pageActions}
          onNavigate={onNavigate}
        />
      )}

      {startsWithHero && content.pageIntro && (
        <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
          <ScrollReveal className={`${EDITORIAL_CONTAINER} text-center`}>
            <p className={`${pe.eyebrow} text-muted-foreground mb-4`}>{content.pageTitle}</p>
            <p className={`${EDITORIAL_PROSE} ${pe.editorialLead} text-muted-foreground`}>
              <EditorialRichText text={content.pageIntro} />
            </p>
          </ScrollReveal>
        </section>
      )}

      {remainingBlocks.map((block, index) => {
        if (block.kind === "section") {
          return (
            <TextSection
              key={`${block.kind}-${index}`}
              title={block.title}
              subtitle={block.subtitle}
              paragraphs={block.paragraphs}
              bullets={block.bullets}
              inverted={index % 2 === 1}
            />
          );
        }

        if (block.kind === "feature-grid") {
          return (
            <ApproachGridSection
              key={`${block.kind}-${index}`}
              title={block.title}
              subtitle={block.subtitle}
              items={block.items}
            />
          );
        }

        if (block.kind === "faq") {
          return (
            <FaqSection
              key={`${block.kind}-${index}`}
              title={block.title}
              subtitle={block.subtitle}
              items={block.items}
            />
          );
        }

        if (block.kind === "testimonial-grid") {
          return (
            <TestimonialsSection
              key={`${block.kind}-${index}`}
              editorial
              title={block.title}
              subtitle={block.subtitle}
              items={block.items}
            />
          );
        }

        if (block.kind === "cta-band") {
          return (
            <CtaBandSection
              key={`${block.kind}-${index}`}
              title={block.title}
              text={block.text}
              action={block.action}
              onNavigate={onNavigate}
            />
          );
        }

        if (block.kind === "hero") {
          return (
            <TextSection
              key={`${block.kind}-${index}`}
              title={block.title}
              subtitle={block.eyebrow}
              paragraphs={[block.subtitle]}
            />
          );
        }

        return null;
      })}
    </>
  );
}
