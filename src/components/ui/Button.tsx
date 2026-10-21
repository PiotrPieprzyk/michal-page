import type { ComponentProps } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

/**
 * Button looks (HANDOFF §2 "Buttons"). Accent is reserved for call/submit.
 * Heights are set per use with h-* classes; every variant is at least 48px tall.
 */
export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-3 rounded-[12px] no-underline transition-colors select-none",
  call: "bg-accent text-ink font-extrabold hover:bg-[#ff7d36]",
  outlineDark: "border-2 border-beige-200 text-white font-bold hover:bg-white/10",
  outline: "border-2 border-forest-800 text-forest-800 bg-white font-bold hover:bg-beige-50",
  green: "bg-forest-800 text-white font-bold hover:bg-forest-900",
  link: "min-h-12 inline-flex items-center gap-2 font-bold text-forest-800 underline underline-offset-4 decoration-2 hover:text-forest-900",
} as const;

type CallButtonProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  /** Analytics: where the button sits (hero, header, sticky_bar, services_cta, pricing, footer, form). */
  track: string;
  iconSize?: number;
  showIcon?: boolean;
};

/** Orange tel: button. `call_click` is sent by the delegated listener in Analytics. */
export function CallButton({
  href,
  track,
  iconSize = 22,
  showIcon = true,
  className,
  children,
  ...rest
}: CallButtonProps) {
  return (
    <a href={href} data-call={track} className={cx(buttonStyles.base, buttonStyles.call, className)} {...rest}>
      {showIcon && <Icon name="phone" size={iconSize} strokeWidth={2.4} />}
      {children}
    </a>
  );
}

export function ArrowLink({ className, children, ...rest }: ComponentProps<"a">) {
  return (
    <a className={cx(buttonStyles.link, className)} {...rest}>
      {children}
      <Icon name="arrow-right" size={18} strokeWidth={2.2} />
    </a>
  );
}
