import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  standalone: false,
})
export class LibraryPage {
  private bookService = inject(BookService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  books: Book[] = [];
  isLoading = true;
  searchTerm = '';

  ionViewWillEnter(): void {
    this.loadBooks();
  }

  get filteredBooks(): Book[] {
    if (!this.searchTerm.trim()) return this.books;
    const term = this.searchTerm.toLowerCase();
    return this.books.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        b.author?.toLowerCase().includes(term)
    );
  }

  loadBooks(): void {
    this.isLoading = true;
    this.bookService.getLibrary().subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar la biblioteca');
      },
    });
  }

  openBook(book: Book): void {
    this.router.navigate(['/reader', book.id], {
      queryParams: { title: book.title },
    });
  }

  async importBook(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub,.pdf,.txt';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const loading = await this.loadingCtrl.create({
        message: 'Importando libro...',
      });
      await loading.present();

      this.bookService.importBook(file).subscribe({
        next: (book) => {
          loading.dismiss();
          this.books.unshift(book);
          this.showToast(`"${book.title}" importado`);
        },
        error: () => {
          loading.dismiss();
          this.showToast('Error al importar el libro');
        },
      });
    };
    input.click();
  }

  async confirmDelete(book: Book): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar libro',
      message: `¿Eliminar "${book.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.bookService.deleteBook(book.id).subscribe({
              next: () => {
                this.books = this.books.filter((b) => b.id !== book.id);
                this.showToast('Libro eliminado');
              },
              error: () => this.showToast('Error al eliminar'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  getProgressPercent(book: Book): number {
    return Math.round(book.progress * 100);
  }

  handleRefresh(event: any): void {
    this.bookService.getLibrary().subscribe({
      next: (books) => {
        this.books = books;
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
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
