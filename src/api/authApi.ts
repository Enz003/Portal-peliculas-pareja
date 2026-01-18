import { createHttpClient } from './http';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const http = createHttpClient({ baseUrl });

interface AuthResponse {
    success: boolean;
    data: {
        accessToken: string;
        user: any;
    };
}

export const authApi = {
    login: async (email: string, password: string) => {
        const res = await http.post<AuthResponse>('/auth/login', { email, password });
        return res.data;
    },
    register: async (name: string, email: string, password: string) => {
        const res = await http.post<AuthResponse>('/auth/register', { name, email, password });
        return res.data;
    }
};
