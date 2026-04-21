import axios, { AxiosRequestConfig } from "axios";
import { getCurrentUser } from "./firebase";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL
        : process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 200000, // 200 seconds
    timeoutErrorMessage: "Timeout exceeded! Try again.",
    validateStatus: (status) => {
        return status >= 200 && status < 300;
    }
});

// Add auth token to requests if user is logged in
axiosInstance.interceptors.request.use(async (config) => {
    const user = await getCurrentUser();
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export class HttpClient {
    static async get<T>(url: string, config?: AxiosRequestConfig) {
        try {
            const response = await axiosInstance.get<T>(url, config);
            return response.data;
        } catch (error: unknown) {
            throw (error as { response?: { data?: unknown } }).response?.data || error;
        }
    }

    static async post<T>(url: string, data: unknown, config?: AxiosRequestConfig) {
        try {
            const response = await axiosInstance.post<T>(url, data, config);
            return response.data;
        } catch (error: unknown) {
            throw (error as { response?: { data?: unknown } }).response?.data || error;
        }
    }

    static async put<T>(url: string, data: unknown, config?: AxiosRequestConfig) {
        try {
            const response = await axiosInstance.put<T>(url, data, config);
            return response.data;
        } catch (error: unknown) {
            throw (error as { response?: { data?: unknown } }).response?.data || error;
        }
    }

    static async patch<T>(url: string, data: unknown, config?: AxiosRequestConfig) {
        try {
            const response = await axiosInstance.patch<T>(url, data, config);
            return response.data;
        } catch (error: unknown) {
            throw (error as { response?: { data?: unknown } }).response?.data || error;
        }
    }

    static async delete<T>(url: string, config?: AxiosRequestConfig) {
        try {
            const response = await axiosInstance.delete<T>(url, config);
            return response.data;
        } catch (error: unknown) {
            throw (error as { response?: { data?: unknown } }).response?.data || error;
        }
    }
}
