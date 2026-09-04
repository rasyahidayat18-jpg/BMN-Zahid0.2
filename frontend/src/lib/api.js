import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const IMG_BASE = `${BACKEND_URL}/api/images`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bmn_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login") {
        localStorage.removeItem("bmn_token");
        localStorage.removeItem("bmn_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const imageUrl = (id) => (id ? `${IMG_BASE}/${id}` : null);

export default api;
