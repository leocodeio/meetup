"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import { useColor } from "./color-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colors = [
  { name: "Zinc", value: "zinc" as const, color: "bg-zinc-600" },
  { name: "Slate", value: "slate" as const, color: "bg-slate-600" },
  { name: "Stone", value: "stone" as const, color: "bg-stone-600" },
  { name: "Gray", value: "gray" as const, color: "bg-gray-600" },
  { name: "Neutral", value: "neutral" as const, color: "bg-neutral-600" },
  { name: "Red", value: "red" as const, color: "bg-red-600" },
  { name: "Rose", value: "rose" as const, color: "bg-rose-600" },
  { name: "Orange", value: "orange" as const, color: "bg-orange-600" },
  { name: "Green", value: "green" as const, color: "bg-green-600" },
  { name: "Blue", value: "blue" as const, color: "bg-blue-600" },
  { name: "Yellow", value: "yellow" as const, color: "bg-yellow-600" },
  { name: "Violet", value: "violet" as const, color: "bg-violet-600" },
];

export function ColorSelector() {
  const { color, setColor } = useColor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colors.map((c) => (
          <DropdownMenuItem
            key={c.value}
            onClick={() => setColor(c.value)}
            className="flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded-full ${c.color}`} />
            {c.name}
            {color === c.value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
