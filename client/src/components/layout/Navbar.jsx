import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	FaDiscord,
	FaBars,
	FaTimes,
	FaUser,
	FaSignOutAlt,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const { user, logout } = useContext(AuthContext);
	const navigate = useNavigate();

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 50) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleLogout = () => {
		logout();
		navigate('/');
		setIsOpen(false);
	};

	return (
		<nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
			<div className="navbar-container">
				<Link to="/" className="navbar-logo">
					<img src="/logo.svg" alt="Kiyo Logo" />
					<span>Project Kiyo</span>
				</Link>

				<div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? <FaTimes /> : <FaBars />}
				</div>

				<ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
					<li className="nav-item">
						<Link
							to="/"
							className="nav-link"
							onClick={() => setIsOpen(false)}
						>
							Home
						</Link>
					</li>

					<li className="nav-item">
						<Link
							to="/commands"
							className="nav-link"
							onClick={() => setIsOpen(false)}
						>
							Commands
						</Link>
					</li>

					{user ? (
						<>
							<li className="nav-item">
								<Link
									to="/dashboard"
									className="nav-link"
									onClick={() => setIsOpen(false)}
								>
									Dashboard
								</Link>
							</li>

							{user.isAdmin && (
								<li className="nav-item">
									<Link
										to="/servers"
										className="nav-link"
										onClick={() => setIsOpen(false)}
									>
										Servers
									</Link>
								</li>
							)}

							<li className="nav-item profile-menu">
								<div className="nav-profile">
									<img
										src={
											user.avatar || '/default-avatar.png'
										}
										alt={user.username}
										className="nav-avatar"
									/>
									<span>{user.username}</span>

									<div className="dropdown-menu">
										<Link
											to="/profile"
											className="dropdown-item"
											onClick={() => setIsOpen(false)}
										>
											<FaUser /> Profile
										</Link>
										<div className="dropdown-divider"></div>
										<button
											onClick={handleLogout}
											className="dropdown-item"
										>
											<FaSignOutAlt /> Logout
										</button>
									</div>
								</div>
							</li>
						</>
					) : (
						<li className="nav-item login-button">
							<Link
								to="/login"
								className="btn discord-btn"
								onClick={() => setIsOpen(false)}
							>
								<FaDiscord /> Login
							</Link>
						</li>
					)}
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
