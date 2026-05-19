export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  fileFormat: 'epub' | 'pdf' | 'txt';
  totalChapters: number;
  totalWords: number;
  progress: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  orderIndex: number;
  wordCount: number;
  text: string;
}

export interface ReadingProgress {
  bookId: string;
  chapterId: string;
  wordIndex: number;
  percentage: number;
}
