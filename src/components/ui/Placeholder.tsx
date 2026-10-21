import { Icon } from "./Icon";
import { cx } from "./cx";

/**
 * Striped stand-in shown until a real photo is uploaded in Sanity.
 * The label names the shot that's needed (the photographer's shot list, HANDOFF §7).
 */
export function Placeholder({
  label,
  tone = "neutral",
  withIcon = false,
  className,
  labelClassName,
}: {
  label: string;
  tone?: "neutral" | "before" | "after";
  withIcon?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cx(
        "flex flex-col items-center justify-center gap-2 text-center font-semibold",
        tone === "neutral" && "stripes text-[#4a3b28]",
        tone === "before" && "stripes-before text-[#3e3020]",
        tone === "after" && "stripes-after text-[#2e4a36]",
        className,
      )}
    >
      {withIcon && <Icon name="camera" size={40} strokeWidth={1.7} className="size-8 lg:size-10" />}
      <span className={labelClassName}>{label}</span>
    </div>
  );
}
