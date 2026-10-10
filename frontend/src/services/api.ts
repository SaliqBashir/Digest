import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";
    // Login itself 401s on bad credentials; don't log out for that.
    if (status === 401 && !url.includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export const getUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signUpUser = async (email: string, password: string) => {
  const response = await api.post("/auth/signup", { email, password });
  return response.data;
};

export const getFiles = async (limit = 50, offset = 0) => {
  const response = await api.get("/search", { params: { limit, offset } });
  return response.data;
};

export const upload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
  return response.data;
};

export const deleteFile = async (itemId: number) => {
  const response = await api.delete(`/delete/${itemId}`);
  return response.data;
};

export const lookupFiles = async (text: string) => {
  const response = await api.get("/lookup", {
    params: { text },
    timeout: 180000,
  });
  return response.data;
};

export const getFileById = async (id: number) => {
  const response = await api.get(`/search/${id}`);
  return response.data;
};

export const updatePassword = async (new_password: string) => {
  const response = await api.put("/auth/password", { new_password });
  return response.data;
};

export default api;
