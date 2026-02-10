"use client";

import * as React from "react";

type Color = "zinc" | "slate" | "stone" | "gray" | "neutral" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet";

interface ColorContextType {
  color: Color;
  setColor: (color: Color) => void;
}

const ColorContext = React.createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = React.useState<Color>("zinc");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("color-theme") as Color | null;
    const initialColor = stored || "zinc";
    console.log("[ColorProvider] Initializing with color:", initialColor);
    setColorState(initialColor);
    document.documentElement.setAttribute("data-color", initialColor);
    console.log("[ColorProvider] Set data-color attribute to:", document.documentElement.getAttribute("data-color"));
  }, []);

  const setColor = React.useCallback((newColor: Color) => {
    console.log("[ColorProvider] Setting color to:", newColor);
    setColorState(newColor);
    if (mounted) {
      document.documentElement.setAttribute("data-color", newColor);
      localStorage.setItem("color-theme", newColor);
      console.log("[ColorProvider] Updated data-color attribute to:", document.documentElement.getAttribute("data-color"));
    }
  }, [mounted]);

  return (
    <ColorContext.Provider value={{ color, setColor }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = React.useContext(ColorContext);
  if (context === undefined) {
    throw new Error("useColor must be used within a ColorProvider");
  }
  return context;
}
