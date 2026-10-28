import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { CalendarIcon, Camera, ChevronLeft, ChevronRight, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import sea from "@/assets/sea.png.asset.json";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEFAULT_NAME, greeting, migrateDayTasks, usePersisted, useProfile, type Profile } from "@/lib/todo-store";
import { EmojiPicker, Sticker } from "@/components/EmojiPicker";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "My day — Today planner" },
      { name: "description", content: "Your week, lists and tasks for the day." },
      { property: "og:title", content: "My day — Today planner" },
      { property: "og:description", content: "Your week, lists and tasks for the day." },
    ],
  }),
  component: TodoPage,
});

type Task = { id: string; text: string; done: boolean; emoji?: string | undefined };
type List = { id: string; name: string };
const uid = () => Math.random().toString(36).slice(2, 10);

function TodoPage() {
  useEffect(() => { migrateDayTasks(); }, []);
  const [{ name, photo }, setProfile] = useProfile();
  const [date, setDate] = useState(new Date());
  const [lists, setLists] = usePersisted<List[]>("todo.lists", []);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [tasks, setTasks] = usePersisted<Record<string, Task[]>>("todo.tasks", {});
  const [photos, setPhotos] = usePersisted<(string | null)[]>("todo.photos", [null, null, null]);
  const [draft, setDraft] = useState("");
  const [draftEmoji, setDraftEmoji] = useState<string | null>(null);
  const [newList, setNewList] = useState<string | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date, { weekStartsOn: 1 }), i));
  const dayKey = `day|${format(date, "yyyy-MM-dd")}`;
  const key = activeList ?? dayKey;
  const dayTasks = tasks[key] ?? [];
  const update = (fn: (t: Task[]) => Task[]) => setTasks((all) => ({ ...all, [key]: fn(all[key] ?? []) }));

  const addTask = () => {
    if (!draft.trim()) return;
    update((t) => [...t, { id: uid(), text: draft.trim(), done: false, emoji: draftEmoji ?? undefined }]);
    setDraftEmoji(null);
    setDraft("");
  };
  const addList = () => {
    if (newList?.trim()) {
      const l = { id: uid(), name: newList.trim() };
      setLists((ls) => [...ls, l]);
      setActiveList(l.id);
    }
    setNewList(null);
  };
  const removeList = (id: string) => {
    setLists((ls) => ls.filter((l) => l.id !== id));
    setTasks((all) => Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith(id + "|"))));
    if (activeList === id) setActiveList(null);
  };
  const activeName = lists.find((l) => l.id === activeList)?.name;

  return (
    <main className="min-h-screen bg-cover bg-fixed bg-center px-4 py-10" style={{ backgroundImage: `url(${sea.url})` }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" className="text-4xl md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            {greeting()}, {name} <Sticker name="hibiscus" className="inline-block h-[1em] w-[1em] align-[-0.1em]" />
          </Link>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger className="pill-shadow flex items-center gap-2 rounded-lg bg-pill px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:bg-day md:px-5 md:py-2 md:text-sm">
              <span className="md:hidden">{format(date, "MMMM")}</span>
              <span className="hidden md:inline">{format(date, "MMMM yyyy")}</span>
              <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setActiveList(null); setCalOpen(false); } }}
                weekStartsOn={1}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
          <ProfileMenu profile={{ name, photo }} onChange={setProfile} />
        </header>

        {/* Week strip */}
        <section className="glass flex items-center gap-1 rounded-xl p-2 md:gap-2 md:p-6">
          <button aria-label="Previous week" onClick={() => setDate(addDays(date, -7))} className="hidden rounded-full p-1 transition hover:bg-pill md:block">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="grid flex-1 grid-cols-7 gap-1.5 md:gap-4">
            {week.map((d) => {
              const sel = isSameDay(d, date);
              const today = isSameDay(d, new Date());
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => { setDate(d); setActiveList(null); }}
                  className={cn(
                    "pill-shadow flex aspect-[4/5] flex-col items-center justify-center rounded-lg text-base transition hover:-translate-y-1 md:aspect-[4/4.5] md:text-sm",
                    sel
                      ? "bg-day font-bold outline-2 -outline-offset-2 outline-foreground"
                      : "bg-pill hover:bg-day",
                  )}
                >
                  <span className="font-display text-lg md:text-base">{format(d, "EEE")}</span>
                  <span className={cn("mt-1 text-sm md:text-xs", today && "font-bold underline")}>{format(d, "d")}</span>
                </button>
              );
            })}
          </div>
          <button aria-label="Next week" onClick={() => setDate(addDays(date, 7))} className="hidden rounded-full p-1 transition hover:bg-pill md:block">
            <ChevronRight className="h-5 w-5" />
          </button>
        </section>

        {/* Lists */}
        <h2 className="mt-5 mb-2 text-sm font-semibold" style={{ fontFamily: "var(--font-sans)" }}>Lists</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveList(null)}
            className={cn(
              "pill-shadow flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
              activeList === null ? "bg-day" : "bg-pill hover:bg-day/70",
            )}
          >
            {format(date, "EEEE")}
          </button>
          {lists.map((l) => (
            <div key={l.id} className="group relative">
              <button
                onClick={() => setActiveList(activeList === l.id ? null : l.id)}
                className={cn(
                  "pill-shadow rounded-lg px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                  activeList === l.id ? "bg-day" : "bg-pill hover:bg-day/70",
                )}
              >
                {l.name}
              </button>
              <button
                aria-label={`Remove ${l.name}`}
                onClick={() => removeList(l.id)}
                className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {newList !== null ? (
            <input
              autoFocus
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addList(); if (e.key === "Escape") setNewList(null); }}
              onBlur={addList}
              placeholder="List name"
              className="pill-shadow rounded-lg bg-card px-4 py-2 text-sm outline-none"
            />
          ) : (
            <button aria-label="Add list" onClick={() => setNewList("")} className="pill-shadow rounded-lg bg-pill px-4 py-2 transition hover:-translate-y-0.5 hover:bg-day">
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Day */}
        <h2 className="mt-5 mb-2 text-sm font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
          {activeList ? activeName : format(date, "EEEE")}
        </h2>
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <section className="glass flex min-h-72 flex-col rounded-xl p-4">
            <ul className="max-h-[17rem] flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:var(--day-active)_transparent] [scrollbar-width:thin]">

              {dayTasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-3">
                  <button
                    aria-label={t.done ? "Mark not done" : "Mark done"}
                    onClick={() => update((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    className={cn("h-3 w-3 shrink-0 rounded-full border border-foreground/60 transition hover:bg-day", t.done && "bg-day-active")}
                  />
                  <div className="pill-shadow flex flex-1 items-center justify-between rounded-md bg-card px-3 py-2 text-sm transition group-hover:-translate-y-0.5">
                    <span className={cn("flex items-center gap-3", t.done && "text-muted-foreground line-through")}>
                      {t.text}
                      {t.emoji && <Sticker name={t.emoji} className="h-6 w-6" />}
                    </span>
                    <button
                      aria-label="Remove task"
                      onClick={() => update((ts) => ts.filter((x) => x.id !== t.id))}
                      className="rounded-full p-1 opacity-0 transition group-hover:opacity-100 hover:bg-pill"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex shrink-0 items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full border border-foreground/60" />
              <div className="pill-shadow flex flex-1 items-center gap-2 rounded-md bg-card px-3 py-1">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Write something"
                  className="min-w-0 flex-1 bg-transparent py-1 text-sm italic outline-none placeholder:text-muted-foreground"
                />
                {draftEmoji && (
                  <button aria-label="Remove emoji" onClick={() => setDraftEmoji(null)} className="transition hover:opacity-60">
                    <Sticker name={draftEmoji} className="h-6 w-6" />
                  </button>
                )}
                <EmojiPicker onPick={setDraftEmoji} />
              </div>
            </div>

          </section>

          <section className="grid h-[17rem] grid-cols-2 grid-rows-2 gap-4 md:h-auto">
            <PhotoSlot src={photos[0] ?? null} onChange={(v) => setPhotos((p) => p.map((x, i) => (i === 0 ? v : x)))} />
            <PhotoSlot src={photos[2] ?? null} className="row-span-2" onChange={(v) => setPhotos((p) => p.map((x, i) => (i === 2 ? v : x)))} />
            <PhotoSlot src={photos[1] ?? null} onChange={(v) => setPhotos((p) => p.map((x, i) => (i === 1 ? v : x)))} />
          </section>
        </div>
      </div>
    </main>
  );
}

function PhotoSlot({ src, onChange, className }: { src: string | null; onChange: (v: string | null) => void; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    if (ref.current) ref.current.value = "";
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      onChange(c.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  };
  return (
    <div className={cn("glass group relative min-h-32 overflow-hidden rounded-xl", className)}>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {src ? (
        <>
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
          <button
            aria-label="Remove photo"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <button aria-label="Add photo" onClick={() => ref.current?.click()} className="absolute inset-0 flex items-center justify-center transition hover:bg-pill/60">
          <ImageIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
