export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  file_count: number;
}

export interface File {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  created_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  language?: string;
  file_id?: string;
}

export interface FileContent {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  size: number;
  created_at: string;
}

export interface ReviewIssue {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  file: string;
  line: number | null;
}

export interface Review {
  id: string;
  project_id: string;
  user_id: string;
  file_ids: string[];
  template: string;
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  created_at: string;
}

export interface ReviewResponse extends Review {}

export interface AIProviderResponse {
  id: string;
  name: string;
  base_url: string;
  model_name: string;
  is_default: boolean;
  created_at: string;
}

export interface ProviderInput {
  name: string;
  base_url: string;
  api_key: string;
  model_name: string;
  is_default?: boolean;
}

export interface AIProvider {
  id: string;
  user_id: string;
  name: string;
  base_url: string;
  api_key: string;
  model_name: string;
  is_default: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  messages: Message[];
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
