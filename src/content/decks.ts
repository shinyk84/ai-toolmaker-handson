import type { Deck } from "@/lib/slides";
import w1 from "./week1.json";
import w2 from "./week2.json";
import w3 from "./week3.json";
import w4 from "./week4.json";

/**
 * 수업 PT 데이터. 내용 수정은 weekN.json 파일만 고치면 됩니다.
 * (같은 JSON으로 `npm run deck:pptx` 실행 시 PowerPoint 파일도 생성)
 */
export const DECKS: Deck[] = [w1, w2, w3, w4] as Deck[];

export const getDeck = (week: number) => DECKS.find((d) => d.week === week) ?? null;
