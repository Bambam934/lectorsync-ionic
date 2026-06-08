import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Chapter } from '../../models/book.model';
import { BookService } from '../../services/book';
import { TtsService, TtsState } from '../../services/tts';

@Component({
  selector: 'app-reader',
  templateUrl: './reader.page.html',
  styleUrls: ['./reader.page.scss'],
  standalone: false,
})
export class ReaderPage implements ViewWillEnter, OnDestroy {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private ttsService = inject(TtsService);
  private toastCtrl = inject(ToastController);

  bookId = '';
  bookTitle = '';
  chapters: Chapter[] = [];
  currentChapter: Chapter | null = null;
  words: string[] = [];
  ttsState: TtsState = { isPlaying: false, currentWordIndex: 0, rate: 1.0 };
  isLoading = true;
  showToc = false;
  fontSize = 18;

  private ttsSub?: Subscription;

  ionViewWillEnter(): void {
    this.bookId = this.route.snapshot.paramMap.get('bookId') ?? '';
    this.bookTitle =
      this.route.snapshot.queryParamMap.get('title') ?? 'Libro';
    this.loadChapters();

    this.ttsSub = this.ttsService.state$.subscribe((state) => {
      this.ttsState = state;
    });
  }

  ngOnDestroy(): void {
    this.ttsService.stop();
    this.ttsSub?.unsubscribe();
  }

  loadChapters(): void {
    this.isLoading = true;
    this.bookService.getChapters(this.bookId).subscribe({
      next: (chapters) => {
        this.chapters = chapters;
        if (chapters.length > 0) {
          this.selectChapter(chapters[0]);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar capítulos');
      },
    });
  }

  selectChapter(chapter: Chapter): void {
    this.ttsService.stop();
    this.isLoading = true;
    this.showToc = false;

    this.bookService.getChapterText(this.bookId, chapter.id).subscribe({
      next: (full) => {
        this.currentChapter = full;
        this.words = full.text
          .split(/\s+/)
          .filter((w: string) => w.length > 0);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar el capítulo');
      },
    });
  }

  togglePlayback(): void {
    if (!this.currentChapter) return;

    if (this.ttsState.isPlaying) {
      this.ttsService.pause();
    } else if (this.currentChapter.text) {
      this.ttsService.speak(this.currentChapter.text);
    }
  }

  stopPlayback(): void {
    this.ttsService.stop();
  }

  setRate(rate: number): void {
    this.ttsService.setRate(rate);
  }

  changeFontSize(delta: number): void {
    this.fontSize = Math.max(12, Math.min(32, this.fontSize + delta));
  }

  toggleToc(): void {
    this.showToc = !this.showToc;
  }

  isCurrentWord(index: number): boolean {
    return this.ttsState.isPlaying && this.ttsState.currentWordIndex === index;
  }

  goToNextChapter(): void {
    if (!this.currentChapter) return;
    const idx = this.chapters.findIndex(
      (c) => c.id === this.currentChapter!.id
    );
    if (idx < this.chapters.length - 1) {
      this.selectChapter(this.chapters[idx + 1]);
    }
  }

  goToPreviousChapter(): void {
    if (!this.currentChapter) return;
    const idx = this.chapters.findIndex(
      (c) => c.id === this.currentChapter!.id
    );
    if (idx > 0) {
      this.selectChapter(this.chapters[idx - 1]);
    }
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
