import { notFound } from "next/navigation";
import DeckPlayer from "@/components/slides/DeckPlayer";
import { getDeck } from "@/content/decks";
import { getSession } from "@/lib/auth";

export default async function ClassDeck({ params }: { params: Promise<{ week: string }> }) {
  const deck = getDeck(Number((await params).week));
  if (!deck) notFound();
  const s = await getSession();
  const isAdmin = s?.role === "admin";
  // 강사 노트는 관리자에게만 전달
  const slides = isAdmin ? deck.slides : deck.slides.map(({ notes: _n, ...rest }) => rest as typeof rest);
  return <DeckPlayer slides={slides} label={deck.title} backHref="/class" backLabel="수업 목록" showNotes={isAdmin} />;
}
