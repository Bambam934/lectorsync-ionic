import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, ToastController, ViewWillEnter } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Chapter } from '../../models/book.model';
import { BookService } from '../../services/book';
import { PreferencesService } from '../../services/preferences';
import { TtsService, TtsState } from '../../services/tts';

@Component({
  selector: 'app-reader',
  templateUrl: './reader.page.html',
  styleUrls: ['./reader.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderPage implements ViewWillEnter, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private ttsService = inject(TtsService);
  private prefs = inject(PreferencesService);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(IonContent) ionContent?: IonContent;
  @ViewChildren('wordRef') wordEls?: QueryList<ElementRef<HTMLElement>>;

  bookId = '';
  bookTitle = '';
  chapters: Chapter[] = [];
  currentChapter: Chapter | null = null;
  words: string[] = [];
  ttsState: TtsState = {
    isPlaying: false,
    isPaused: false,
    currentWordIndex: -1,
    totalWords: 0,
    rate: 1.0,
  };
  isLoading = true;
  showToc = false;
  fontSize = 18;
  readonly rateOptions: number[] = [0.75, 1.0, 1.25, 1.5, 1.75];

  private ttsSub?: Subscription;
  private lastHighlightedIndex = -1;

  ionViewWillEnter(): void {
    this.bookId = this.route.snapshot.paramMap.get('bookId') ?? '';
    this.bookTitle = this.route.snapshot.queryParamMap.get('title') ?? 'Libro';
    this.restorePreferences();
    this.loadChapters();

    this.ttsSub?.unsubscribe();
    this.ttsSub = this.ttsService.state$.subscribe((state) => {
      this.ttsState = state;
      const idx = state.currentWordIndex;
      if (state.isPlaying && idx >= 0 && idx !== this.lastHighlightedIndex) {
        this.lastHighlightedIndex = idx;
        this.scrollToCurrentWord(idx);
      }
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.ttsService.stop();
    this.ttsSub?.unsubscribe();
  }

  trackByWord(index: number): number {
    return index;
  }

  loadChapters(): void {
    this.isLoading = true;
    this.bookService.getChapters(this.bookId).subscribe({
      next: (chapters) => {
        this.chapters = chapters;
        if (chapters.length > 0) {
          this.selectChapter(chapters[0]);
        } else {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.showToast('Error al cargar capítulos');
      },
    });
  }

  selectChapter(chapter: Chapter): void {
    this.ttsService.stop();
    this.isLoading = true;
    this.showToc = false;
    this.lastHighlightedIndex = -1;

    this.bookService.getChapterText(this.bookId, chapter.id).subscribe({
      next: (full) => {
        this.currentChapter = full;
        this.words = full.text
          .split(/\s+/)
          .filter((w: string) => w.length > 0);
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.ionContent?.scrollToTop(150), 50);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.showToast('Error al cargar el capítulo');
      },
    });
  }

  togglePlayback(): void {
    if (!this.currentChapter) return;

    if (this.ttsState.isPlaying) {
      this.ttsService.pause();
      return;
    }
    if (this.ttsState.isPaused) {
      this.ttsService.resume();
      return;
    }
    if (this.currentChapter.text) {
      this.ttsService.speak(this.currentChapter.text);
    }
  }

  stopPlayback(): void {
    this.ttsService.stop();
    this.lastHighlightedIndex = -1;
  }

  setRate(rate: number): void {
    this.ttsService.setRate(rate);
    this.prefs.setDefaultRate(rate);
    this.cdr.markForCheck();
  }

  changeFontSize(delta: number): void {
    this.fontSize = Math.max(14, Math.min(34, this.fontSize + delta));
    this.prefs.setDefaultFontSize(this.fontSize);
    this.cdr.markForCheck();
  }

  toggleToc(): void {
    this.showToc = !this.showToc;
    this.cdr.markForCheck();
  }

  isCurrentWord(index: number): boolean {
    return (
      (this.ttsState.isPlaying || this.ttsState.isPaused) &&
      this.ttsState.currentWordIndex === index
    );
  }

  isPastWord(index: number): boolean {
    return (
      (this.ttsState.isPlaying || this.ttsState.isPaused) &&
      this.ttsState.currentWordIndex > index
    );
  }

  goToNextChapter(): void {
    if (!this.currentChapter) return;
    const idx = this.chapters.findIndex(
      (c) => c.id === this.currentChapter!.id,
    );
    if (idx >= 0 && idx < this.chapters.length - 1) {
      this.selectChapter(this.chapters[idx + 1]);
    }
  }

  goToPreviousChapter(): void {
    if (!this.currentChapter) return;
    const idx = this.chapters.findIndex(
      (c) => c.id === this.currentChapter!.id,
    );
    if (idx > 0) {
      this.selectChapter(this.chapters[idx - 1]);
    }
  }

  isFirstChapter(): boolean {
    if (!this.currentChapter) return true;
    return this.chapters.findIndex((c) => c.id === this.currentChapter!.id) <= 0;
  }

  isLastChapter(): boolean {
    if (!this.currentChapter) return true;
    const idx = this.chapters.findIndex(
      (c) => c.id === this.currentChapter!.id,
    );
    return idx === -1 || idx >= this.chapters.length - 1;
  }

  get progressPercentage(): number {
    if (!this.ttsState.totalWords) return 0;
    const idx = Math.max(0, this.ttsState.currentWordIndex);
    return Math.min(100, Math.round((idx / this.ttsState.totalWords) * 100));
  }

  private restorePreferences(): void {
    const prefs = this.prefs.current;
    this.fontSize = prefs.defaultFontSize;
    this.ttsService.setRate(prefs.defaultRate);
    this.ttsService.setVoice(prefs.voiceURI);
  }

  private scrollToCurrentWord(index: number): void {
    if (!this.wordEls || !this.ionContent) return;
    const el = this.wordEls.toArray()[index]?.nativeElement;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
    });
    await toast.present();
  }
}
