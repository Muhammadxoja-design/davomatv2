const token = localStorage.getItem("token");
const API_URL = '/api';

export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string | null;
  role: string;
  school_id: string | null;
  province_id: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

console.log('Making request to:', `${API_URL}${endpoint}`);

const response = await fetch(`${API_URL}${endpoint}`, {
  ...options,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...headers, // merge extra headers if needed
  },
});

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Xatolik yuz berdi' }));
      throw new Error(error.error || 'Xatolik yuz berdi');
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (response.status === 204) {
      return undefined as any;
    } else if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType && !contentType.includes('application/json')) {
      // Any non-JSON application type (Excel, PDF, binary, etc.) should be treated as Blob
      return response.blob() as any;
    }
    
    // Default to JSON
    return response.json();
  }

  // Auth
  async login(phoneNumber: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(data: any): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Provinces
  async getProvinces(): Promise<any[]> {
    return this.request<any[]>('/provinces');
  }

  async createProvince(name: string): Promise<any> {
    return this.request<any>('/provinces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Schools
  async getSchools(provinceId?: string): Promise<any[]> {
    const query = provinceId ? `?province_id=${provinceId}` : '';
    return this.request<any[]>(`/schools${query}`);
  }

  async createSchool(data: any): Promise<any> {
    return this.request<any>('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Classes
  async getClasses(schoolId?: string): Promise<any[]> {
    const query = schoolId ? `?school_id=${schoolId}` : '';
    return this.request<any[]>(`/classes${query}`);
  }

  async createClass(data: any): Promise<any> {
    return this.request<any>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Students
  async getStudents(schoolId?: string, classId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);
    if (classId) params.append('class_id', classId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/students${query}`);
  }

  async createStudent(formData: FormData): Promise<any> {
    return this.request<any>('/students', {
      method: 'POST',
      body: formData,
    });
  }

  // Attendance
  async getAttendance(classId?: string, date?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (date) params.append('date', date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/attendance${query}`);
  }

  async markAttendance(formData: FormData): Promise<any> {
    return this.request<any>('/attendance', {
      method: 'POST',
      body: formData,
    });
  }

  // Statistics
  async getStatistics(schoolId?: string, date?: string): Promise<any> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);
    if (date) params.append('date', date);
    return this.request<any>(`/statistics?${params.toString()}`);
  }

  // Activity Logs
  async getActivities(schoolId?: string, limit: number = 100): Promise<any[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (schoolId) params.append('school_id', schoolId);
    return this.request<any[]>(`/activity-logs?${params.toString()}`);
  }

  // Reports
  async getReport(params: {
    class_id: string;
    type: string;
    start_date: string;
    end_date: string;
  }): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/reports?${query}`);
  }

  async exportReport(params: {
    class_id: string;
    type: string;
    start_date: string;
    end_date: string;
    format: 'excel' | 'pdf';
  }): Promise<Blob> {
    const query = new URLSearchParams(params as any).toString();
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/reports/export?${query}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Xatolik yuz berdi' }));
      throw new Error(error.error || 'Xatolik yuz berdi');
    }

    return response.blob();
  }

  // Profile
  async updateProfile(data: any): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
