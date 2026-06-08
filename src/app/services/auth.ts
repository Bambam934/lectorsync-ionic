import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, delay, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

interface LocalUser extends User {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly localUsersKey = 'local_demo_users';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadStoredUser();
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (environment.useLocalMock) {
      return this.localLogin(credentials).pipe(
        tap((res) => this.handleAuth(res))
      );
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    if (environment.useLocalMock) {
      return this.localRegister(data).pipe(
        tap((res) => this.handleAuth(res))
      );
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && !environment.useLocalMock) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, { refresh_token: refreshToken })
        .subscribe();
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  private localLogin(credentials: LoginRequest): Observable<AuthResponse> {
    const email = this.normalizeEmail(credentials.email);
    const user = this.getLocalUsers().find((item) => item.email === email);

    if (!user || user.password !== credentials.password) {
      return throwError(() => ({
        error: { message: 'Correo o contraseña incorrectos' },
      }));
    }

    return of(this.createAuthResponse(user)).pipe(delay(350));
  }

  private localRegister(data: RegisterRequest): Observable<AuthResponse> {
    const email = this.normalizeEmail(data.email);
    const users = this.getLocalUsers();
    const exists = users.some((item) => item.email === email);

    if (exists) {
      return throwError(() => ({
        error: { message: 'Este correo ya está registrado localmente' },
      }));
    }

    const user: LocalUser = {
      id: `local-user-${Date.now()}`,
      name: data.name.trim() || email.split('@')[0] || 'Usuario demo',
      email,
      password: data.password,
    };
    this.saveLocalUsers([...users, user]);

    return of(this.createAuthResponse(user)).pipe(delay(350));
  }

  private createAuthResponse(user: User): AuthResponse {
    const tokenSuffix = `${user.id}-${Date.now()}`;

    return {
      access_token: `local-demo-access-token-${tokenSuffix}`,
      refresh_token: `local-demo-refresh-token-${tokenSuffix}`,
      user,
    };
  }

  private getLocalUsers(): LocalUser[] {
    const stored = localStorage.getItem(this.localUsersKey);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as LocalUser[];
  }

  private saveLocalUsers(users: LocalUser[]): void {
    localStorage.setItem(this.localUsersKey, JSON.stringify(users));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
