"use client";

import { useColor } from "./theme/color-context";
import { useEffect, useState } from "react";

export function ColorDebug() {
  const { color } = useColor();
  const [htmlAttr, setHtmlAttr] = useState<string | null>(null);
  const [htmlClass, setHtmlClass] = useState<string | null>(null);

  useEffect(() => {
    setHtmlAttr(document.documentElement.getAttribute("data-color"));
    setHtmlClass(document.documentElement.className);
  }, [color]);

  return (
    <div className="fixed bottom-8 left-4 bg-card border rounded-lg p-4 shadow-lg text-xs space-y-2 z-[var(--z-debug)]">
      <div>Context Color: <strong>{color}</strong></div>
      <div>HTML data-color: <strong>{htmlAttr || "none"}</strong></div>
      <div>HTML class: <strong>{htmlClass || "none"}</strong></div>
      <div className="flex gap-2 mt-2">
        <div className="w-8 h-8 bg-primary rounded" title="primary" />
        <div className="w-8 h-8 bg-primary/50 rounded" title="primary/50" />
        <div className="w-8 h-8 bg-primary/20 rounded" title="primary/20" />
      </div>
    </div>
  );
}
