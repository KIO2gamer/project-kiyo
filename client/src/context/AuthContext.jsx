import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Check if user is already logged in on page load
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const token = localStorage.getItem('token');
				if (!token) {
					setLoading(false);
					return;
				}

				// Configure axios to use the token
				axios.defaults.headers.common['Authorization'] =
					`Bearer ${token}`;

				const response = await axios.get('/api/users/me');
				setUser(response.data);
			} catch (err) {
				console.error('Error fetching user:', err);
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	// Login function
	const login = async (credentials) => {
		try {
			setError(null);
			const response = await axios.post('/auth/login', credentials);
			const { token, refreshToken, user } = response.data;

			localStorage.setItem('token', token);
			localStorage.setItem('refreshToken', refreshToken);
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

			setUser(user);
			return user;
		} catch (err) {
			setError(err.response?.data?.error || 'Login failed');
			throw err;
		}
	};

	// Login with Discord function
	const loginWithDiscord = async () => {
		try {
			setError(null);
			const response = await axios.post('/auth/discord', {
				redirectUrl: `${window.location.origin}/dashboard`,
			});

			window.location.href = response.data.url;
		} catch (err) {
			setError(err.response?.data?.error || 'Discord login failed');
			throw err;
		}
	};

	// Handle token refresh
	const refreshToken = async () => {
		try {
			const refreshToken = localStorage.getItem('refreshToken');
			if (!refreshToken) return false;

			const response = await axios.post('/auth/refresh-token', {
				refreshToken,
			});
			const { token, refreshToken: newRefreshToken } = response.data;

			localStorage.setItem('token', token);
			localStorage.setItem('refreshToken', newRefreshToken);
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

			return true;
		} catch (err) {
			console.error('Token refresh failed:', err);
			logout();
			return false;
		}
	};

	// Logout function
	const logout = async () => {
		try {
			await axios.post('/auth/logout');
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
			delete axios.defaults.headers.common['Authorization'];
			setUser(null);
		}
	};

	// Setup axios interceptor for token refresh
	useEffect(() => {
		const interceptor = axios.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (error.response?.status === 401 && !error.config._retry) {
					error.config._retry = true;

					const refreshSuccessful = await refreshToken();
					if (refreshSuccessful) {
						return axios(error.config);
					}
				}

				return Promise.reject(error);
			},
		);

		return () => axios.interceptors.response.eject(interceptor);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				error,
				login,
				loginWithDiscord,
				logout,
				setError,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
