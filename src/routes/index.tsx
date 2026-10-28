import { createFileRoute, Link } from "@tanstack/react-router";
import sea from "@/assets/sea.png.asset.json";
import { Sticker } from "@/components/EmojiPicker";
import { greeting } from "@/lib/todo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — Today planner" },
      { name: "description", content: "Let's start planning today's journey, one task at a time." },
      { property: "og:title", content: "Welcome — Today planner" },
      { property: "og:description", content: "Let's start planning today's journey, one task at a time." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center px-4 text-center"
      style={{ backgroundImage: `url(${sea.url})` }}
    >
      <h1 className="text-5xl md:text-6xl">{greeting()}, Åsa <Sticker name="hibiscus" className="inline-block h-[1em] w-[1em] align-[-0.1em]" /></h1>
      <p className="mt-3 text-sm">Let's start planning today's journey, one task at a time.</p>
      <Link
        to="/todo"
        className="pill-shadow mt-8 rounded-lg bg-pill px-12 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-day"
      >
        To do
      </Link>
    </main>
  );
}
