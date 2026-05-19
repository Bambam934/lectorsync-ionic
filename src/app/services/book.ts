import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book, Chapter, ReadingProgress } from '../models/book.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private get headers(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getLibrary(): Observable<Book[]> {
    return this.http.get<Book[]>(`${environment.apiUrl}/library`, {
      headers: this.headers,
    });
  }

  getChapters(bookId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(
      `${environment.apiUrl}/books/${bookId}/chapters`,
      { headers: this.headers }
    );
  }

  getChapterText(bookId: string, chapterId: string): Observable<Chapter> {
    return this.http.get<Chapter>(
      `${environment.apiUrl}/books/${bookId}/chapters/${chapterId}`,
      { headers: this.headers }
    );
  }

  updateProgress(progress: ReadingProgress): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/books/${progress.bookId}/progress`,
      progress,
      { headers: this.headers }
    );
  }

  importBook(file: File): Observable<Book> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Book>(`${environment.apiUrl}/library/import`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getAccessToken()}`,
      }),
    });
  }

  deleteBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/books/${bookId}`, {
      headers: this.headers,
    });
  }
}
