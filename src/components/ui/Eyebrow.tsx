import { cx } from "./cx";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "block text-[13px] font-bold uppercase tracking-[0.08em] text-ink-3 lg:text-sm lg:tracking-[0.1em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Eyebrow + H2 + lead used at the top of each section. */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  lead,
  className,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-2 lg:gap-2.5", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="m-0 text-[30px] leading-[1.1] tracking-[-0.01em] text-forest-900 lg:text-[48px] lg:leading-[1.05] lg:tracking-[-0.015em]"
      >
        {heading}
      </h2>
      {lead && <p className="m-0 text-base leading-normal text-ink-2 lg:text-lg lg:leading-[1.55]">{lead}</p>}
    </div>
  );
}
