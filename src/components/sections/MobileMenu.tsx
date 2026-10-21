"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import type { NavLink } from "@/content/types";
import { CallButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";

/** Hamburger + right-hand drawer (< 1024px): nav links and the call button. Uses <dialog> for focus trap and Esc. */
export function MobileMenu({
  nav,
  tel,
  phone,
  hoursText,
  callLabel,
}: {
  nav: NavLink[];
  tel: string;
  phone: string;
  hoursText: string;
  callLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  // The drawer is meaningless on desktop; close it if the viewport grows past lg.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Otwórz menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="flex size-12 items-center justify-center rounded-[10px] text-white hover:bg-white/10 lg:hidden"
      >
        <Menu aria-hidden="true" focusable="false" size={26} strokeWidth={2.2} />
      </button>

      <dialog
        ref={ref}
        id="mobile-menu"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className={cx(
          "on-dark m-0 ml-auto h-dvh max-h-none w-[min(320px,85vw)] max-w-none bg-forest-900 p-0 text-white",
          "backdrop:bg-black/50 lg:hidden",
        )}
      >
        <div className="flex h-full flex-col px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="flex h-14 items-center justify-end">
            <button
              type="button"
              aria-label="Zamknij menu"
              onClick={() => setOpen(false)}
              className="flex size-12 items-center justify-center rounded-[10px] text-white hover:bg-white/10"
            >
              <Icon name="x" size={26} strokeWidth={2.2} />
            </button>
          </div>

          <nav aria-label="Menu główne" className="mt-2">
            <ul className="flex flex-col text-lg font-semibold">
              {nav.map((item) => (
                <li key={item.href + item.label} className="border-b border-white/10">
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center text-white no-underline hover:text-beige-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <span className="text-center text-sm text-beige-200">{hoursText}</span>
            <CallButton href={tel} track="mobile_menu" iconSize={20} className="h-14 text-[17px]">
              {callLabel} · {phone}
            </CallButton>
          </div>
        </div>
      </dialog>
    </>
  );
}
