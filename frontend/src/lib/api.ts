import { queryClient } from "./queryClient";

// Use environment variable for production backend URL, fallback to local for development
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  requireAuth: boolean = true
): Promise<Response> {
  const headers: HeadersInit = {};
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (requireAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

export async function login(email: string, password: string) {
  const response = await apiRequest('POST', '/auth/login', { email, password }, false);
  return response.json();
}

export async function signup(email: string, password: string, organizationName: string) {
  const response = await apiRequest('POST', '/auth/signup', { email, password, organizationName }, false);
  return response.json();
}

export async function seedDatabase() {
  const response = await apiRequest('POST', '/auth/seed', {}, false);
  return response.json();
}

export async function getNotes() {
  const response = await apiRequest('GET', '/notes');
  return response.json();
}

export async function createNote(title: string, body: string) {
  const response = await apiRequest('POST', '/notes', { title, body });
  return response.json();
}

export async function updateNote(id: string, title: string, body: string) {
  const response = await apiRequest('PUT', `/notes/${id}`, { title, body });
  return response.json();
}

export async function deleteNote(id: string) {
  const response = await apiRequest('DELETE', `/notes/${id}`);
  return response.json();
}

export async function upgradeTenant(slug: string) {
  const response = await apiRequest('POST', `/tenants/${slug}/upgrade`);
  return response.json();
}
