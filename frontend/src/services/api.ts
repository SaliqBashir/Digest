import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUser = async (email: string , password: string) => {
  const response = await api.post("/auth/login", { email, password});
  return response.data
};

export const signUpUser = async (email: string, password: string) => {
  const response = await api.post("/auth/signup", { email, password });
  return response.data;
};

export const getFiles = async () => {
  const response = await api.get("/search");
  return response.data; 
};

export const upload = async (file: File) => {
    const formData = new FormData();
  formData.append("file", file); 
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteFile = async (itemId: number) => {
  const response = await api.delete(`/delete/${itemId}`);
  return response.data;
};

export const lookupFiles = async (text: string) => {
  const response = await api.get('/lookup', { params: { text } });
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
