"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  close,
  children,
  className = "",
  onKey,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  className?: string;
  onKey?: (key: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"dialog " + className}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (onKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
          e.preventDefault();
          onKey(e.key);
        }
        if (e.key === "Tab") {
          const controls = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],summary,video[controls],[tabindex="0"]',
            ),
          ).filter((el) => el.getClientRects().length > 0);
          const first = controls[0],
            last = controls.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      {children}
    </dialog>
  );
}
