import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AppPreferences {
  theme: ThemeMode;
  voiceURI: string | null;
  defaultRate: number;
  defaultFontSize: number;
  language: string;
}

const KEYS = {
  theme: 'lectorsync_theme',
  voice: 'lectorsync_voice_uri',
  rate: 'lectorsync_tts_rate',
  font: 'lectorsync_font_size',
  lang: 'lectorsync_lang',
} as const;

const DEFAULTS: AppPreferences = {
  theme: 'auto',
  voiceURI: null,
  defaultRate: 1.0,
  defaultFontSize: 18,
  language: 'es-ES',
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private prefsSubject = new BehaviorSubject<AppPreferences>(this.load());
  prefs$ = this.prefsSubject.asObservable();
  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaListener = () => {
        if (this.current.theme === 'auto') this.applyTheme('auto');
      };
      this.mediaQuery.addEventListener?.('change', this.mediaListener);
    }
  }

  get current(): AppPreferences {
    return this.prefsSubject.value;
  }

  setTheme(theme: ThemeMode): void {
    localStorage.setItem(KEYS.theme, theme);
    this.applyTheme(theme);
    this.patch({ theme });
  }

  setVoice(voiceURI: string | null): void {
    if (voiceURI === null) {
      localStorage.removeItem(KEYS.voice);
    } else {
      localStorage.setItem(KEYS.voice, voiceURI);
    }
    this.patch({ voiceURI });
  }

  setDefaultRate(rate: number): void {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    localStorage.setItem(KEYS.rate, String(clamped));
    this.patch({ defaultRate: clamped });
  }

  setDefaultFontSize(size: number): void {
    const clamped = Math.max(14, Math.min(34, size));
    localStorage.setItem(KEYS.font, String(clamped));
    this.patch({ defaultFontSize: clamped });
  }

  setLanguage(lang: string): void {
    localStorage.setItem(KEYS.lang, lang);
    this.patch({ language: lang });
  }

  clearReadingData(): void {
    localStorage.removeItem('local_demo_books');
    localStorage.removeItem('local_demo_chapters');
  }

  reset(): void {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    this.applyTheme(DEFAULTS.theme);
    this.prefsSubject.next({ ...DEFAULTS });
  }

  applyInitialTheme(): void {
    this.applyTheme(this.current.theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    const resolved =
      theme === 'auto'
        ? this.mediaQuery?.matches
          ? 'dark'
          : 'light'
        : theme;

    root.setAttribute('data-theme', resolved);
    root.classList.toggle('ion-palette-dark', resolved === 'dark');
  }

  private load(): AppPreferences {
    const theme = (localStorage.getItem(KEYS.theme) as ThemeMode) || DEFAULTS.theme;
    const voiceURI = localStorage.getItem(KEYS.voice);
    const rate = Number(localStorage.getItem(KEYS.rate));
    const font = Number(localStorage.getItem(KEYS.font));
    const lang = localStorage.getItem(KEYS.lang) || DEFAULTS.language;

    return {
      theme,
      voiceURI: voiceURI || null,
      defaultRate: Number.isFinite(rate) && rate > 0 ? rate : DEFAULTS.defaultRate,
      defaultFontSize:
        Number.isFinite(font) && font >= 14 && font <= 34
          ? font
          : DEFAULTS.defaultFontSize,
      language: lang,
    };
  }

  private patch(partial: Partial<AppPreferences>): void {
    this.prefsSubject.next({ ...this.prefsSubject.value, ...partial });
  }
}
