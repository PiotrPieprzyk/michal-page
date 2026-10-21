import { Icon } from "./Icon";
import { cx } from "./cx";

/** Tree mark + company name (+ optional tagline). */
export function Logo({
  name,
  tagline,
  variant = "dark",
  as = "a",
  className,
}: {
  name: string;
  tagline?: string;
  variant?: "dark" | "light";
  as?: "a" | "div";
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag
      {...(as === "a" ? { href: "#top" } : {})}
      className={cx(
        "flex min-h-12 items-center gap-2.5 no-underline lg:gap-3",
        variant === "dark" ? "text-white" : "text-forest-900",
        className,
      )}
    >
      <Icon
        name="tree"
        size={34}
        className={cx(
          "size-7 shrink-0",
          tagline && "lg:size-[34px]",
          variant === "dark" ? "text-beige-200" : "text-forest-800",
        )}
      />
      <span className="flex min-w-0 flex-col leading-[1.1]">
        <span className={cx("font-extrabold", tagline ? "text-[17px] lg:text-xl" : "text-lg")}>{name}</span>
        {tagline && <span className="text-xs text-beige-200 lg:text-[13px]">{tagline}</span>}
      </span>
    </Tag>
  );
}
