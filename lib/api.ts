const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = {
  async get(endpoint: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },
}; 