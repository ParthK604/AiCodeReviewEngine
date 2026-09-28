import axios from "axios";
import { toast } from "react-hot-toast";

import { getToken } from "./auth";
import type {
  AIProviderResponse,
  FileContent,
  FileTreeNode,
  Project,
  ProviderInput,
  ReviewResponse,
  ChatSession,
  Message,
} from "../types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail ?? error.response?.data?.message ?? "Something went wrong";
  }
  return "Something went wrong";
}

function handleApiError(error: unknown): never {
  toast.error(getApiErrorMessage(error));
  throw error;
}

export async function getProjects(): Promise<Project[]> {
  try { return (await api.get<Project[]>("/api/projects/")).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  try { const project = (await api.post<Project>("/api/projects/", data)).data; toast.success("Project created"); return project; } catch (error: unknown) { return handleApiError(error); }
}

export async function deleteProject(id: string): Promise<void> {
  try { await api.delete(`/api/projects/${id}`); toast.success("Project deleted"); } catch (error: unknown) { handleApiError(error); }
}

export async function getProject(id: string): Promise<Project> {
  try { return (await api.get<Project>(`/api/projects/${id}`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function uploadZip(projectId: string, file: globalThis.File): Promise<{ message: string; file_count: number }> {
  const formData = new FormData();
  formData.append("zip_file", file);
  try { const result = (await api.post<{ message: string; file_count: number }>(`/api/projects/${projectId}/files/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data; toast.success(`${result.file_count} files uploaded`); return result; } catch (error: unknown) { return handleApiError(error); }
}

export async function getFileTree(projectId: string): Promise<FileTreeNode[]> {
  try { return (await api.get<FileTreeNode[]>(`/api/projects/${projectId}/files/`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getFileContent(projectId: string, fileId: string): Promise<FileContent> {
  try { return (await api.get<FileContent>(`/api/projects/${projectId}/files/${fileId}`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getProviders(): Promise<AIProviderResponse[]> {
  try { return (await api.get<AIProviderResponse[]>("/api/providers/")).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function createProvider(data: ProviderInput): Promise<AIProviderResponse> {
  try { const provider = (await api.post<AIProviderResponse>("/api/providers/", data)).data; toast.success("Provider saved"); return provider; } catch (error: unknown) { return handleApiError(error); }
}

export async function deleteProvider(id: string): Promise<void> {
  try { await api.delete(`/api/providers/${id}`); toast.success("Provider deleted"); } catch (error: unknown) { handleApiError(error); }
}

export async function setDefaultProvider(id: string): Promise<AIProviderResponse> {
  try { return (await api.post<AIProviderResponse>(`/api/providers/${id}/set-default`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function testProvider(data: Omit<ProviderInput, "name" | "is_default">): Promise<{ success: boolean; message: string }> {
  try { return (await api.post<{ success: boolean; message: string }>("/api/providers/test", data)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function createReview(data: { project_id: string; file_ids: string[]; template: "security" | "performance" | "quality" }): Promise<ReviewResponse> {
  try { return (await api.post<ReviewResponse>("/api/reviews/", data)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getReviews(projectId?: string, template?: string): Promise<ReviewResponse[]> {
  try { return (await api.get<ReviewResponse[]>("/api/reviews/", { params: { project_id: projectId, template } })).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getReview(id: string): Promise<ReviewResponse> {
  try { return (await api.get<ReviewResponse>(`/api/reviews/${id}`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function createChatSession(projectId: string): Promise<ChatSession> {
  try { return (await api.post<ChatSession>("/api/chat/sessions", { project_id: projectId })).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getChatSessions(projectId: string): Promise<ChatSession[]> {
  try { return (await api.get<ChatSession[]>("/api/chat/sessions", { params: { project_id: projectId } })).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function getChatSession(sessionId: string): Promise<ChatSession> {
  try { return (await api.get<ChatSession>(`/api/chat/sessions/${sessionId}`)).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function sendMessage(sessionId: string, content: string): Promise<Message> {
  try { return (await api.post<Message>(`/api/chat/sessions/${sessionId}/messages`, { content })).data; } catch (error: unknown) { return handleApiError(error); }
}

export async function searchReviews(projectId?: string, template?: string, q?: string): Promise<ReviewResponse[]> {
  try { return (await api.get<ReviewResponse[]>("/api/reviews/search", { params: { project_id: projectId, template, q } })).data; } catch (error: unknown) { return handleApiError(error); }
}
