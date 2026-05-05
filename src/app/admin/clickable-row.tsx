"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

type ClickableRowProps = {
  children: ReactNode;
  className?: string;
  href: string;
  tableRow?: boolean;
};

function shouldIgnoreClick(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, form"));
}

export function ClickableRow({ children, className = "", href, tableRow = false }: ClickableRowProps) {
  const router = useRouter();
  const Tag = tableRow ? "tr" : "div";

  function open(event: MouseEvent<HTMLElement>) {
    if (shouldIgnoreClick(event.target)) return;
    router.push(href);
  }

  function openFromKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (shouldIgnoreClick(event.target)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

  return (
    <Tag
      className={`${className} admin-clickable-row`.trim()}
      onClick={open}
      onKeyDown={openFromKeyboard}
      role="link"
      tabIndex={0}
      data-href={href}
    >
      {children}
    </Tag>
  );
}
