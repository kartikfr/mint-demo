class AuthManager {
  private token: string | null = null;
  private expiresAt: Date | null = null;
  private readonly API_KEY = '9F476773305B9EE7DE245875FF416DD1FB7281A1B51F2A475F36C6CA4A27FE2E';
  private readonly TOKEN_URL = 'https://uat-platform.bankkaro.com/partner/token';
  private tokenPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.expiresAt && this.expiresAt > new Date()) {
      return this.token;
    }

    // Return existing promise if token fetch is in progress
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.fetchNewToken();
    
    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchNewToken(): Promise<string> {
    try {
      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'x-api-key': this.API_KEY })
      });

      if (response.status === 403) {
        throw new Error('API key expired or invalid. Please contact BankKaro for a new API key.');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch auth token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data.jwttoken) {
        this.token = data.data.jwttoken;
        this.expiresAt = new Date(data.data.expiresAt);
        return this.token;
      }

      throw new Error('Invalid token response');
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'partner-token': token,
          'Content-Type': 'application/json'
        }
      });

      // If token expired, clear cache and retry once
      if (response.status === 401 || response.status === 403) {
        this.token = null;
        this.expiresAt = null;
        
        const newToken = await this.getToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'partner-token': newToken,
            'Content-Type': 'application/json'
          }
        });
      }

      return response;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }
}

export const authManager = new AuthManager();
