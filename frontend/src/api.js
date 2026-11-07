import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// expired / invalid token -> back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ["/login", "/register"].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// turn any API error into a readable message
export function getError(err) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg.replace("Value error, ", "")).join(", ");
  if (typeof detail === "string") return detail;
  return err.message || "Something went wrong";
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default api;
