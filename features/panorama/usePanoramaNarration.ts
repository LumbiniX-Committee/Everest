import { useCallback, useEffect, useRef, useState } from 'react';

import type { PanoramaSegment } from '@/data';
import { voice } from '@/services';
import type { InterfaceLanguage } from '@/types';

export type NarrationState = {
  playing: boolean;
  /** The sentence being read, or the one it paused on. */
  index: number;
  finished: boolean;
  /** Null while the phone is still being asked. */
  voiceAvailable: boolean | null;
  play: () => void;
  pause: () => void;
  /** Read from a given sentence, e.g. after a language switch. */
  playFrom: (index: number) => void;
};

/**
 * Reads a panorama's explanation sentence by sentence through the app's
 * text-to-speech (expo-speech, via `services/voice`).
 *
 * Sentence by sentence because Android's speech engine cannot pause: pausing
 * stops it and remembers the sentence, and playing starts that sentence again.
 * It also lets the view turn to each feature as it is named.
 *
 * Where the phone has no voice for the language (most handsets have no Nepali
 * one) nothing is spoken. The sentences still advance at a reading pace, so the
 * on-screen text and the view move together, and the screen says why it is
 * silent rather than pretending to speak.
 */
export function usePanoramaNarration(segments: PanoramaSegment[], language: InterfaceLanguage): NarrationState {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  // Keyed by language, so a switch reads as "not yet known" without a reset.
  const [voiceCheck, setVoiceCheck] = useState<{ language: InterfaceLanguage; available: boolean } | null>(null);
  const voiceAvailable = voiceCheck?.language === language ? voiceCheck.available : null;
  // Every start or stop takes a new generation; callbacks from an older one
  // (a sentence that was stopped, a timer from before a pause) are ignored.
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRef = useRef<boolean | null>(null);
  const playingRef = useRef(false);
  const indexRef = useRef(0);
  /** Set when the language changed mid-sentence: resume once its voice is known. */
  const resumeAt = useRef<number | null>(null);

  const halt = useCallback(() => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    voice.stopSpeaking();
  }, []);

  useEffect(() => {
    let active = true;
    if (playingRef.current) {
      resumeAt.current = indexRef.current;
      halt();
    }
    voiceRef.current = null;
    const settle = (available: boolean) => {
      if (!active) return;
      voiceRef.current = available;
      setVoiceCheck({ language, available });
    };
    voice.hasVoice(language).then(settle, () => settle(false));
    return () => {
      active = false;
    };
  }, [halt, language]);

  const speakFrom = useCallback(
    (start: number) => {
      halt();
      const mine = generation.current;
      const step = (i: number) => {
        if (mine !== generation.current) return;
        if (i >= segments.length) {
          playingRef.current = false;
          setPlaying(false);
          setFinished(true);
          return;
        }
        setIndex(i);
        indexRef.current = i;
        const text = language === 'ne' ? segments[i].ne : segments[i].en;
        const next = () => {
          if (mine !== generation.current) return;
          // A breath between sentences, so the view has time to turn.
          timer.current = setTimeout(() => step(i + 1), 450);
        };
        if (voiceRef.current) {
          voice.speakText(text, language, next, next);
        } else {
          // Silent read-along: about 14 characters a second.
          timer.current = setTimeout(next, Math.max(3500, text.length * 70));
        }
      };
      playingRef.current = true;
      setPlaying(true);
      setFinished(false);
      step(start);
    },
    [halt, language, segments],
  );

  const pause = useCallback(() => {
    halt();
    resumeAt.current = null;
    playingRef.current = false;
    setPlaying(false);
  }, [halt]);

  useEffect(() => {
    if (voiceAvailable == null || resumeAt.current == null) return;
    const at = resumeAt.current;
    resumeAt.current = null;
    speakFrom(at);
  }, [speakFrom, voiceAvailable]);

  const play = useCallback(() => {
    speakFrom(finished ? 0 : index);
  }, [finished, index, speakFrom]);

  // Leaving the screen stops the voice; it must not follow the visitor out.
  useEffect(() => halt, [halt]);

  return { playing, index, finished, voiceAvailable, play, pause, playFrom: speakFrom };
}
