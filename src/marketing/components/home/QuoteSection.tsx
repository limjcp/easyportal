import type { MarketingTestimonial } from "../../data/pageContent/types";
import { pe } from "../../typography";

type QuoteSectionProps = {
  testimonial: MarketingTestimonial;
  imageUrl: string;
  imageAlt: string;
};

export function QuoteSection({ testimonial, imageUrl, imageAlt }: QuoteSectionProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
        <div className="lg:col-span-7 overflow-hidden">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full aspect-[16/10] object-cover grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <div className="w-10 h-px bg-foreground/20 mb-8" />
          <blockquote className={`${pe.quote} text-foreground`}>
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
          <p className={`${pe.eyebrow} text-muted-foreground mt-8`}>
            {testimonial.author}, {testimonial.role}
          </p>
        </div>
      </div>
    </section>
  );
}
