import {
  User,
  Workspace,
  Project,
  Task,
  TaskWorkUnit,
  ResumePoint,
  ContinuityOverview,
  LearningMaterial,
  ChatChannel,
  ChatMessage
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('continuum_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('continuum_token', token);
    } else {
      localStorage.removeItem('continuum_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth
  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Continuity ("Continue Where You Left Off")
  public async getResumePoints(workspaceId?: string): Promise<{ resumePoints: ContinuityOverview[] }> {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return this.request<{ resumePoints: ContinuityOverview[] }>(`/continuity/resume-points${query}`);
  }

  public async startSession(taskId: string): Promise<{ session: any; task: Task; resumePoint: ResumePoint }> {
    return this.request('/continuity/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ taskId })
    });
  }

  public async pauseSession(sessionId: string, stoppingContext?: string, manualNextAction?: string) {
    return this.request(`/continuity/sessions/${sessionId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ stoppingContext, manualNextAction })
    });
  }

  public async overrideResumePoint(taskId: string, checkpointTitle: string, stoppingContext?: string, nextRecommendedAction?: string) {
    return this.request('/continuity/override', {
      method: 'POST',
      body: JSON.stringify({ taskId, checkpointTitle, stoppingContext, nextRecommendedAction })
    });
  }

  // Tasks
  public async getTasks(workspaceId?: string, status?: string): Promise<{ tasks: Task[] }> {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (status) params.append('status', status);
    return this.request<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
  }

  public async getTask(id: string) {
    return this.request<{
      task: Task;
      workUnits: TaskWorkUnit[];
      resumePoint: ResumePoint;
      learningMaterials: LearningMaterial[];
      sessions: any[];
    }>(`/tasks/${id}`);
  }

  public async createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  public async updateTask(id: string, updates: Partial<Task>) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async addWorkUnit(taskId: string, unit: { title: string; unit_type: string; estimated_minutes: number }): Promise<{ workUnits: TaskWorkUnit[]; resumePoint: ResumePoint }> {
    return this.request(`/tasks/${taskId}/work-units`, {
      method: 'POST',
      body: JSON.stringify(unit)
    });
  }

  public async updateWorkUnit(taskId: string, unitId: string, status: string): Promise<{ task?: Task; workUnits: TaskWorkUnit[]; resumePoint: ResumePoint }> {
    return this.request(`/tasks/${taskId}/work-units/${unitId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Scheduler
  public async getDayView(workspaceId: string, date: string) {
    return this.request<{ dayView: any }>(`/scheduler/day?workspaceId=${workspaceId}&date=${date}`);
  }

  public async getWeekView(workspaceId: string, startDate: string) {
    return this.request<{ weekView: any }>(`/scheduler/week?workspaceId=${workspaceId}&startDate=${startDate}`);
  }

  public async getAgendaView(workspaceId: string) {
    return this.request<{ agenda: any }>(`/scheduler/agenda?workspaceId=${workspaceId}`);
  }

  // Workspaces & Projects
  public async getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
    return this.request<{ workspaces: Workspace[] }>('/workspaces');
  }

  public async getProjects(workspaceId?: string): Promise<{ projects: Project[] }> {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return this.request<{ projects: Project[] }>(`/projects${query}`);
  }

  // Learning Materials
  public async getMaterials(taskId?: string, projectId?: string): Promise<{ materials: LearningMaterial[] }> {
    const params = new URLSearchParams();
    if (taskId) params.append('taskId', taskId);
    if (projectId) params.append('projectId', projectId);
    return this.request<{ materials: LearningMaterial[] }>(`/materials?${params.toString()}`);
  }

  public async addMaterial(materialData: any) {
    return this.request('/materials', {
      method: 'POST',
      body: JSON.stringify(materialData)
    });
  }

  // Chat
  public async getChannels(workspaceId?: string): Promise<{ channels: ChatChannel[] }> {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return this.request<{ channels: ChatChannel[] }>(`/chat/channels${query}`);
  }

  public async getMessages(channelId: string): Promise<{ messages: ChatMessage[] }> {
    return this.request<{ messages: ChatMessage[] }>(`/chat/channels/${channelId}/messages`);
  }

  public async sendMessage(channelId: string, content: string): Promise<{ message: ChatMessage }> {
    return this.request<{ message: ChatMessage }>(`/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // AI Assistant
  public async askAI(message: string, workspaceId?: string): Promise<{ reply: string }> {
    return this.request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, workspaceId })
    });
  }

  public async breakdownTaskWithAI(goal: string, category: string, totalMinutes: number) {
    return this.request<{ workUnits: any[] }>('/ai/breakdown', {
      method: 'POST',
      body: JSON.stringify({ goal, category, totalMinutes })
    });
  }

  // Analytics
  public async getAnalytics(): Promise<any> {
    return this.request('/analytics');
  }
}

export const api = new ApiClient();
