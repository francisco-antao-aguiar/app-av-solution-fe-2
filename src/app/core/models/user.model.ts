export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
