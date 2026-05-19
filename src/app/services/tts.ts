import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TtsState {
  isPlaying: boolean;
  currentWordIndex: number;
  rate: number;
}

@Injectable({
  providedIn: 'root',
})
export class TtsService {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private words: string[] = [];

  private stateSubject = new BehaviorSubject<TtsState>({
    isPlaying: false,
    currentWordIndex: 0,
    rate: 1.0,
  });
  state$ = this.stateSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  get isAvailable(): boolean {
    return this.synth !== null;
  }

  speak(text: string, lang = 'es-ES'): void {
    if (!this.synth) return;
    this.stop();

    this.words = text.split(/\s+/).filter((w) => w.length > 0);
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = lang;
    this.utterance.rate = this.stateSubject.value.rate;

    this.utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        const spoken = text.substring(0, event.charIndex);
        const wordIndex = spoken.split(/\s+/).filter((w) => w.length > 0).length;
        this.stateSubject.next({
          ...this.stateSubject.value,
          currentWordIndex: wordIndex,
        });
      }
    };

    this.utterance.onend = () => {
      this.stateSubject.next({
        ...this.stateSubject.value,
        isPlaying: false,
        currentWordIndex: 0,
      });
    };

    this.synth.speak(this.utterance);
    this.stateSubject.next({ ...this.stateSubject.value, isPlaying: true });
  }

  pause(): void {
    this.synth?.pause();
    this.stateSubject.next({ ...this.stateSubject.value, isPlaying: false });
  }

  resume(): void {
    this.synth?.resume();
    this.stateSubject.next({ ...this.stateSubject.value, isPlaying: true });
  }

  stop(): void {
    this.synth?.cancel();
    this.stateSubject.next({
      ...this.stateSubject.value,
      isPlaying: false,
      currentWordIndex: 0,
    });
  }

  setRate(rate: number): void {
    this.stateSubject.next({ ...this.stateSubject.value, rate });
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }
}
