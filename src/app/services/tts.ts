import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  SpeechSynthesisVoice as NativeVoice,
  TextToSpeech,
} from '@capacitor-community/text-to-speech';

export interface AvailableVoice {
  name: string;
  lang: string;
  voiceURI: string;
  isLocal: boolean;
  nativeIndex?: number;
}

export interface TtsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWordIndex: number;
  totalWords: number;
  rate: number;
}

interface WordSpan {
  text: string;
  start: number;
  end: number;
}

const INITIAL_STATE: TtsState = {
  isPlaying: false,
  isPaused: false,
  currentWordIndex: -1,
  totalWords: 0,
  rate: 1.0,
};

@Injectable({ providedIn: 'root' })
export class TtsService {
  private zone = inject(NgZone);

  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;

  private rangeListener: PluginListenerHandle | null = null;
  private wordTimeouts: ReturnType<typeof setTimeout>[] = [];

  private wordSpans: WordSpan[] = [];
  private fullText = '';
  private currentLang = 'es-ES';
  private pausedAtIndex = 0;
  private selectedVoiceURI: string | null = null;

  private stateSubject = new BehaviorSubject<TtsState>({ ...INITIAL_STATE });
  state$ = this.stateSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  private get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  get isAvailable(): boolean {
    return this.isNative || this.synth !== null;
  }

  get currentState(): TtsState {
    return this.stateSubject.value;
  }

  setRate(rate: number): void {
    this.patchState({ rate });
  }

  setVoice(voiceURI: string | null): void {
    this.selectedVoiceURI = voiceURI;
  }

  async listVoices(): Promise<AvailableVoice[]> {
    if (this.isNative) {
      try {
        const result = await TextToSpeech.getSupportedVoices();
        return result.voices.map((v: NativeVoice, idx: number) => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI || `${v.name}|${v.lang}|${idx}`,
          isLocal: v.localService,
          nativeIndex: idx,
        }));
      } catch {
        return [];
      }
    }

    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    if (voices.length > 0) return voices.map((v) => this.toAvailable(v));

    return new Promise((resolve) => {
      const handler = () => {
        this.synth?.removeEventListener?.('voiceschanged', handler);
        resolve(this.synth!.getVoices().map((v) => this.toAvailable(v)));
      };
      this.synth!.addEventListener('voiceschanged', handler);
      setTimeout(() => {
        this.synth?.removeEventListener?.('voiceschanged', handler);
        resolve(this.synth!.getVoices().map((v) => this.toAvailable(v)));
      }, 1500);
    });
  }

  private toAvailable(v: SpeechSynthesisVoice): AvailableVoice {
    return {
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      isLocal: v.localService,
    };
  }

  buildWordSpans(text: string): WordSpan[] {
    const spans: WordSpan[] = [];
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      spans.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return spans;
  }

  async speak(text: string, lang = 'es-ES'): Promise<void> {
    await this.stop();

    const trimmed = text?.trim() ?? '';
    if (!trimmed) return;

    this.fullText = text;
    this.currentLang = lang;
    this.wordSpans = this.buildWordSpans(text);
    this.pausedAtIndex = 0;

    if (this.wordSpans.length === 0) return;

    this.patchState({
      isPlaying: true,
      isPaused: false,
      currentWordIndex: 0,
      totalWords: this.wordSpans.length,
    });

    if (this.isNative) {
      await this.speakNative(text, lang, this.currentState.rate, 0);
    } else {
      this.speakWeb(text, lang, this.currentState.rate);
    }
  }

  async pause(): Promise<void> {
    const state = this.currentState;
    if (!state.isPlaying || state.isPaused) return;

    if (this.isNative) {
      this.pausedAtIndex = Math.max(0, state.currentWordIndex);
      await this.cleanupNative();
      this.patchState({ isPaused: true, isPlaying: false });
      return;
    }

    try {
      this.synth?.pause();
    } catch {}
    this.patchState({ isPaused: true, isPlaying: false });
  }

  async resume(): Promise<void> {
    const state = this.currentState;
    if (!state.isPaused) return;

    if (this.isNative) {
      const remainingText = this.getRemainingText(this.pausedAtIndex);
      if (!remainingText) {
        await this.stop();
        return;
      }
      this.patchState({
        isPlaying: true,
        isPaused: false,
        currentWordIndex: this.pausedAtIndex,
      });
      await this.speakNative(
        remainingText,
        this.currentLang,
        state.rate,
        this.pausedAtIndex,
      );
      return;
    }

    try {
      this.synth?.resume();
    } catch {}
    this.patchState({ isPlaying: true, isPaused: false });
  }

  async stop(): Promise<void> {
    if (this.isNative) {
      await this.cleanupNative();
    } else if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }

    this.pausedAtIndex = 0;
    this.wordSpans = [];
    this.fullText = '';

    this.patchState({
      isPlaying: false,
      isPaused: false,
      currentWordIndex: -1,
      totalWords: 0,
    });
  }

  private speakWeb(text: string, lang: string, rate: number): void {
    if (!this.synth) return;

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = lang;
    this.utterance.rate = rate;
    this.utterance.pitch = 1.0;
    this.utterance.volume = 1.0;

    if (this.selectedVoiceURI) {
      const voice = this.synth
        .getVoices()
        .find((v) => v.voiceURI === this.selectedVoiceURI);
      if (voice) this.utterance.voice = voice;
    }

    this.utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name !== 'word') return;
      const idx = this.findWordIndexByCharIndex(event.charIndex);
      if (idx >= 0) {
        this.zone.run(() => this.patchState({ currentWordIndex: idx }));
      }
    };

    this.utterance.onend = () => {
      this.zone.run(() => this.onSpeechFinished());
    };

    this.utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      this.zone.run(() => this.onSpeechFinished());
    };

    this.synth.speak(this.utterance);
  }

  private async speakNative(
    text: string,
    lang: string,
    rate: number,
    indexOffset: number,
  ): Promise<void> {
    await this.attachNativeListener(text, indexOffset);
    this.scheduleFallbackTimers(text, rate, indexOffset);

    const voiceIndex = await this.resolveNativeVoiceIndex();

    try {
      await TextToSpeech.speak({
        text,
        lang,
        rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback',
        ...(voiceIndex !== undefined ? { voice: voiceIndex } : {}),
      });
      this.zone.run(() => this.onSpeechFinished());
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('cancel')) return;
      console.error('TTS error:', err);
      this.zone.run(() => this.onSpeechFinished());
    } finally {
      await this.detachNativeListener();
      this.clearFallbackTimers();
    }
  }

  private async resolveNativeVoiceIndex(): Promise<number | undefined> {
    if (!this.selectedVoiceURI) return undefined;
    try {
      const result = await TextToSpeech.getSupportedVoices();
      const idx = result.voices.findIndex(
        (v) => (v.voiceURI || `${v.name}|${v.lang}`) === this.selectedVoiceURI,
      );
      return idx >= 0 ? idx : undefined;
    } catch {
      return undefined;
    }
  }

  private async attachNativeListener(
    text: string,
    indexOffset: number,
  ): Promise<void> {
    await this.detachNativeListener();
    const localSpans = this.buildWordSpans(text);

    this.rangeListener = await TextToSpeech.addListener(
      'onRangeStart',
      (info: { start: number; end: number; spokenWord?: string }) => {
        const localIdx = this.findLocalWordIndex(localSpans, info.start);
        if (localIdx < 0) return;
        const globalIdx = indexOffset + localIdx;
        this.zone.run(() => {
          this.clearFallbackTimers();
          this.patchState({ currentWordIndex: globalIdx });
        });
      },
    );
  }

  private async detachNativeListener(): Promise<void> {
    if (!this.rangeListener) return;
    try {
      await this.rangeListener.remove();
    } catch {}
    this.rangeListener = null;
  }

  private scheduleFallbackTimers(
    text: string,
    rate: number,
    indexOffset: number,
  ): void {
    this.clearFallbackTimers();
    const localSpans = this.buildWordSpans(text);
    if (localSpans.length === 0) return;

    const charsPerSecond = 14 * Math.max(0.25, rate);
    let cumulative = 0;
    let prevEnd = 0;

    localSpans.forEach((span, i) => {
      const between = text.substring(prevEnd, span.start);
      const wordChars = span.text.length;
      const pauseBetween = between.length;
      const punctuationPause = this.punctuationPauseAfter(text, span.end);

      cumulative += (wordChars + pauseBetween) * (1000 / charsPerSecond);
      const fireAt = cumulative;
      cumulative += punctuationPause;

      const handle = setTimeout(() => {
        if (!this.rangeListener) return;
        this.zone.run(() =>
          this.patchState({ currentWordIndex: indexOffset + i }),
        );
      }, fireAt);
      this.wordTimeouts.push(handle);
      prevEnd = span.end;
    });
  }

  private punctuationPauseAfter(text: string, endIndex: number): number {
    const ch = text[endIndex];
    if (!ch) return 0;
    if (ch === '.' || ch === '!' || ch === '?') return 350;
    if (ch === ',' || ch === ';' || ch === ':') return 180;
    return 0;
  }

  private clearFallbackTimers(): void {
    for (const t of this.wordTimeouts) clearTimeout(t);
    this.wordTimeouts = [];
  }

  private async cleanupNative(): Promise<void> {
    this.clearFallbackTimers();
    await this.detachNativeListener();
    try {
      await TextToSpeech.stop();
    } catch {}
  }

  private findWordIndexByCharIndex(charIndex: number): number {
    return this.findLocalWordIndex(this.wordSpans, charIndex);
  }

  private findLocalWordIndex(spans: WordSpan[], charIndex: number): number {
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (charIndex >= span.start && charIndex < span.end) return i;
      if (charIndex < span.start) return Math.max(0, i - 1);
    }
    return spans.length - 1;
  }

  private getRemainingText(fromWordIndex: number): string {
    if (fromWordIndex <= 0) return this.fullText;
    if (fromWordIndex >= this.wordSpans.length) return '';
    const span = this.wordSpans[fromWordIndex];
    return this.fullText.substring(span.start);
  }

  private onSpeechFinished(): void {
    if (this.currentState.isPaused) return;
    this.patchState({
      isPlaying: false,
      isPaused: false,
      currentWordIndex: -1,
    });
  }

  private patchState(partial: Partial<TtsState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }
}
