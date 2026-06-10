'use client';

import { useRef } from 'react';
import { BotMessages } from '@/types';

type Setter = React.Dispatch<React.SetStateAction<BotMessages>>;

export function useVarInserter(setConfigMessages: Setter) {
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTextareaKeyRef = useRef<keyof BotMessages | null>(null);

  const trackFocus = (key: keyof BotMessages) =>
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      activeTextareaRef.current = e.target;
      activeTextareaKeyRef.current = key;
    };

  const insertVar = (varStr: string) => {
    const ta = activeTextareaRef.current;
    const key = activeTextareaKeyRef.current;
    if (!ta || !key) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const newValue = ta.value.slice(0, start) + varStr + ta.value.slice(end);
    setConfigMessages((prev) => ({ ...prev, [key]: newValue }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + varStr.length, start + varStr.length);
    });
  };

  return { trackFocus, insertVar };
}
