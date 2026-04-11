import type { CharacterId } from './CHARACTERS';

export type DialogueCharacter = {
  id: CharacterId;
  name: string;
  role: string;
  gender: 'female' | 'male';
  orientation: 'straight' | 'gay' | 'lesbian';
  appearance: string;
  icon: string;
  greeting: string;
  garbledMessage: string;
  messages: readonly string[];
  sectorCompleteMessages: readonly string[];
  metalDealIntro: string;
  metalDealOffer: string;
};

export type DialoguesPayload = {
  version: number;
  characters: readonly DialogueCharacter[];
  sectorDialogues: Record<CharacterId, Record<number, string | string[]>>;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DIALOGUES_URL = `${BASE_URL}/dialogues`;

export async function fetchDialogues(): Promise<DialoguesPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(DIALOGUES_URL, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) {
    throw new Error(`Dialogues fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as DialoguesPayload;
  if (!data || typeof data !== 'object') {
    throw new Error('Dialogues payload is invalid');
  }
  return data;
}

export function getCharacterById(
  dialogues: DialoguesPayload,
  id: CharacterId
): DialogueCharacter | null {
  return dialogues.characters.find((c) => c.id === id) ?? null;
}

export function getRandomMessage(
  dialogues: DialoguesPayload,
  id: CharacterId
): string | null {
  const character = getCharacterById(dialogues, id);
  if (!character || character.messages.length === 0) return null;
  const idx = Math.floor(Math.random() * character.messages.length);
  return character.messages[idx] ?? null;
}
