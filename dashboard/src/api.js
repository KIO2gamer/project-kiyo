import axios from "axios";

// Use environment variable for API URL in production, relative path in dev
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

const api = axios.create({
    baseURL,
    withCredentials: true,
});

api.interceptors.response.use(
    (resp) => resp,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired");
        }
        return Promise.reject(error);
    },
);

export default api;
