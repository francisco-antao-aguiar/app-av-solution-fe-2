import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'http://localhost';

  // Mock users for development
  private mockUsers = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' as const },
    { id: 2, username: 'user', password: 'user123', role: 'user' as const }
  ];

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    // Mock login - in production, this would call the real API
    const mockUser = this.mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (mockUser) {
      const token = 'mock-jwt-token-' + mockUser.id + '-' + Date.now();
      const user: User = {
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
        token: token
      };

      const response: LoginResponse = { token, user };

      return of(response).pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
    }

    return of(null).pipe(
      map(() => {
        throw new Error('Invalid username or password');
      })
    );

    // Real implementation would be:
    // return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
    //   .pipe(
    //     tap(response => {
    //       localStorage.setItem('currentUser', JSON.stringify(response.user));
    //       this.currentUserSubject.next(response.user);
    //     })
    //   );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(role: 'admin' | 'user'): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}
