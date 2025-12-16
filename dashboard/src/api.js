import axios from "axios";

const api = axios.create({
    baseURL: "/api",
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
