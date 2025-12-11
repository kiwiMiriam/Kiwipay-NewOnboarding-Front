export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

// User interface for internal use
export interface User {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  fullName: string;
}

export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}