import React, { useState, useContext } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FaDiscord, FaEnvelope, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
	const { user, loading, login, loginWithDiscord, error, setError } =
		useContext(AuthContext);
	const navigate = useNavigate();
	const location = useLocation();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// Get the redirect path from query string
	const from =
		new URLSearchParams(location.search).get('from') || '/dashboard';

	// Check for token in URL (from OAuth redirect)
	React.useEffect(() => {
		const params = new URLSearchParams(location.search);
		const token = params.get('token');
		const refreshToken = params.get('refreshToken');

		if (token && refreshToken) {
			localStorage.setItem('token', token);
			localStorage.setItem('refreshToken', refreshToken);
			navigate(from, { replace: true });
			window.location.reload(); // Force reload to update auth context
		}
	}, [location, navigate, from]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			setError('Please enter both email and password');
			return;
		}

		try {
			setIsLoggingIn(true);
			await login({ email, password });
			navigate(from, { replace: true });
		} catch (error) {
			console.error('Login failed:', error);
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleDiscordLogin = async () => {
		try {
			setIsLoggingIn(true);
			await loginWithDiscord();
		} catch (error) {
			console.error('Discord login failed:', error);
			setIsLoggingIn(false);
		}
	};

	// Redirect if already authenticated
	if (!loading && user) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<h1>Welcome Back</h1>
					<p>Sign in to continue to your dashboard</p>
				</div>

				{error && <div className="error-message">{error}</div>}

				<button
					className="discord-login-btn"
					onClick={handleDiscordLogin}
					disabled={isLoggingIn}
				>
					<FaDiscord /> Continue with Discord
				</button>

				<div className="divider">
					<span>OR</span>
				</div>

				<form className="login-form" onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="email">
							<FaEnvelope /> Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							disabled={isLoggingIn}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">
							<FaLock /> Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							disabled={isLoggingIn}
						/>
					</div>

					<button
						type="submit"
						className="email-login-btn"
						disabled={isLoggingIn}
					>
						{isLoggingIn ? 'Signing In...' : 'Sign In'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default Login;
