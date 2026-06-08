import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, delay, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book, Chapter, ReadingProgress } from '../models/book.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly localBooksKey = 'local_demo_books';
  private readonly localChaptersKey = 'local_demo_chapters';
  private readonly wordsPerLocalChapter = 180;

  private readonly demoChapters: Chapter[] = [
    {
      id: 'chapter-1',
      bookId: 'demo-book-1',
      title: 'Capítulo 1: El inicio de LectorSync',
      orderIndex: 1,
      wordCount: 82,
      text:
        'LectorSync permite practicar lectura acompañada de audio. Este modo demo funciona sin backend para validar el flujo de inicio de sesión, biblioteca, apertura de libros y controles básicos del lector. Cuando conectes la API real, estas pantallas seguirán usando los mismos servicios y contratos.',
    },
    {
      id: 'chapter-2',
      bookId: 'demo-book-1',
      title: 'Capítulo 2: Lectura sincronizada',
      orderIndex: 2,
      wordCount: 70,
      text:
        'La vista de lectura divide el contenido en palabras y resalta el avance cuando el navegador soporta síntesis de voz. Puedes cambiar el tamaño del texto, navegar capítulos y probar la experiencia principal antes de integrar libros reales desde el servidor.',
    },
  ];

  private get headers(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getLibrary(): Observable<Book[]> {
    if (environment.useLocalMock) {
      return of(this.getLocalBooks()).pipe(delay(250));
    }

    return this.http.get<Book[]>(`${environment.apiUrl}/library`, {
      headers: this.headers,
    });
  }

  getChapters(bookId: string): Observable<Chapter[]> {
    if (environment.useLocalMock) {
      return of(this.getLocalChapters(bookId)).pipe(delay(250));
    }

    return this.http.get<Chapter[]>(
      `${environment.apiUrl}/books/${bookId}/chapters`,
      { headers: this.headers }
    );
  }

  getChapterText(bookId: string, chapterId: string): Observable<Chapter> {
    if (environment.useLocalMock) {
      const chapter = this.getLocalChapters(bookId).find(
        (item) => item.bookId === bookId && item.id === chapterId
      );

      return of(chapter ?? this.createFallbackChapter(bookId)).pipe(delay(250));
    }

    return this.http.get<Chapter>(
      `${environment.apiUrl}/books/${bookId}/chapters/${chapterId}`,
      { headers: this.headers }
    );
  }

  updateProgress(progress: ReadingProgress): Observable<void> {
    if (environment.useLocalMock) {
      const books = this.getLocalBooks().map((book) =>
        book.id === progress.bookId
          ? { ...book, progress: progress.percentage }
          : book
      );
      this.saveLocalBooks(books);

      return of(undefined).pipe(delay(150));
    }

    return this.http.put<void>(
      `${environment.apiUrl}/books/${progress.bookId}/progress`,
      progress,
      { headers: this.headers }
    );
  }

  importBook(file: File): Observable<Book> {
    if (environment.useLocalMock) {
      return from(this.importLocalBook(file)).pipe(delay(350));
    }

    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Book>(`${environment.apiUrl}/library/import`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getAccessToken()}`,
      }),
    });
  }

  deleteBook(bookId: string): Observable<void> {
    if (environment.useLocalMock) {
      this.saveLocalBooks(this.getLocalBooks().filter((book) => book.id !== bookId));

      return of(undefined).pipe(delay(150));
    }

    return this.http.delete<void>(`${environment.apiUrl}/books/${bookId}`, {
      headers: this.headers,
    });
  }

  private getLocalBooks(): Book[] {
    const stored = localStorage.getItem(this.localBooksKey);
    if (stored) {
      return JSON.parse(stored) as Book[];
    }

    const books: Book[] = [
      {
        id: 'demo-book-1',
        title: 'Guía demo de LectorSync',
        author: 'EquipoEPMB02',
        fileFormat: 'txt',
        totalChapters: this.demoChapters.length,
        totalWords: this.demoChapters.reduce(
          (total, chapter) => total + chapter.wordCount,
          0
        ),
        progress: 0,
      },
    ];
    this.saveLocalBooks(books);

    return books;
  }

  private saveLocalBooks(books: Book[]): void {
    localStorage.setItem(this.localBooksKey, JSON.stringify(books));
  }

  private getLocalChapters(bookId: string): Chapter[] {
    if (bookId === 'demo-book-1') {
      return this.demoChapters;
    }

    const stored = localStorage.getItem(this.localChaptersKey);
    const chaptersByBook = stored
      ? (JSON.parse(stored) as Record<string, Chapter[]>)
      : {};

    return chaptersByBook[bookId] ?? [this.createFallbackChapter(bookId)];
  }

  private saveLocalChapters(bookId: string, chapters: Chapter[]): void {
    const stored = localStorage.getItem(this.localChaptersKey);
    const chaptersByBook = stored
      ? (JSON.parse(stored) as Record<string, Chapter[]>)
      : {};
    chaptersByBook[bookId] = chapters;

    localStorage.setItem(this.localChaptersKey, JSON.stringify(chaptersByBook));
  }

  private async importLocalBook(file: File): Promise<Book> {
    const id = `local-book-${Date.now()}`;
    const title = file.name.replace(/\.[^/.]+$/, '');
    const fileFormat = this.getFileFormat(file);
    const text = await this.getLocalBookText(file, fileFormat, title);
    const chapters = this.createChaptersFromText(id, text);
    const wordCount = chapters.reduce(
      (total, chapter) => total + chapter.wordCount,
      0
    );

    const newBook: Book = {
      id,
      title,
      author: 'Importado localmente',
      fileFormat,
      totalChapters: chapters.length,
      totalWords: wordCount,
      progress: 0,
    };
    const books = [newBook, ...this.getLocalBooks()];
    this.saveLocalBooks(books);
    this.saveLocalChapters(id, chapters);

    return newBook;
  }

  private async getLocalBookText(
    file: File,
    fileFormat: Book['fileFormat'],
    title: string
  ): Promise<string> {
    if (fileFormat === 'txt') {
      const text = (await file.text()).trim();

      if (text) {
        return text;
      }
    }

    return `El archivo "${title}" fue importado localmente en LectorSync. En esta versión demo se guarda en la biblioteca y se crea un capítulo de prueba para validar búsqueda, apertura del libro y lectura con voz. La extracción real de contenido para archivos ${fileFormat.toUpperCase()} queda preparada para una siguiente iteración.`;
  }

  private createFallbackChapter(bookId: string): Chapter {
    return {
      id: `${bookId}-fallback-chapter`,
      bookId,
      title: 'Contenido no disponible',
      orderIndex: 1,
      wordCount: 31,
      text:
        'Este libro está registrado en la biblioteca local, pero todavía no tiene contenido procesado. Importa un archivo TXT para validar lectura con contenido real en modo demo.',
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private createChaptersFromText(bookId: string, text: string): Chapter[] {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const chunks: string[][] = [];

    for (let index = 0; index < words.length; index += this.wordsPerLocalChapter) {
      chunks.push(words.slice(index, index + this.wordsPerLocalChapter));
    }

    return (chunks.length > 0 ? chunks : [[]]).map((chunk, index) => ({
      id: `${bookId}-chapter-${index + 1}`,
      bookId,
      title:
        chunks.length > 1
          ? `Pagina ${index + 1}`
          : 'Contenido importado',
      orderIndex: index + 1,
      wordCount: chunk.length,
      text: chunk.join(' '),
    }));
  }

  private getFileFormat(file: File): Book['fileFormat'] {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'epub' || extension === 'pdf' || extension === 'txt') {
      return extension;
    }

    return 'txt';
  }
}
