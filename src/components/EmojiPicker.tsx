import { useState } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const STICKERS = [
  "hibiscus", "yellow-hibiscus", "palm", "surfboard", "strawberries", "plane",
  "shell-bow", "blue-shell", "snail-shell", "pearl-bow", "starfish", "dolphin",
  "turtle", "icecream", "camera", "beach-chair",
];

export function Sticker({ name, className }: { name: string; className?: string }) {
  return <img src={`/emoji/${name}.png`} alt={name.replace("-", " ")} className={cn("object-contain", className)} />;
}

export function EmojiPicker({ onPick }: { onPick: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label="Add emoji" className="rounded-full p-1 transition hover:bg-pill">
        <Smile className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="grid w-64 grid-cols-4 gap-1 p-2">
        {STICKERS.map((s) => (
          <button
            key={s}
            onClick={() => { onPick(s); setOpen(false); }}
            className="rounded-md p-1 transition hover:scale-110 hover:bg-pill"
          >
            <Sticker name={s} className="h-10 w-10" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
