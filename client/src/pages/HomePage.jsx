import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
	return (
		<div className="home-page">
			<div className="hero">
				<h1>Project Kiyo</h1>
				<p className="tagline">
					A powerful Discord bot with web dashboard
				</p>
				<div className="cta-buttons">
					<a
						href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
						className="btn primary-btn"
						target="_blank"
						rel="noopener noreferrer"
					>
						Add to Discord
					</a>
					<Link to="/dashboard" className="btn secondary-btn">
						Dashboard
					</Link>
				</div>
			</div>

			<section className="features">
				<h2>Features</h2>
				<div className="feature-grid">
					<div className="feature-card">
						<div className="feature-icon">🛡️</div>
						<h3>Moderation</h3>
						<p>
							Powerful tools to keep your server safe and
							organized
						</p>
					</div>
					<div className="feature-card">
						<div className="feature-icon">🎮</div>
						<h3>Games</h3>
						<p>
							Engage your community with fun games like trivia and
							hangman
						</p>
					</div>
					<div className="feature-card">
						<div className="feature-icon">📊</div>
						<h3>Statistics</h3>
						<p>
							Detailed insights into your server activity and
							growth
						</p>
					</div>
					<div className="feature-card">
						<div className="feature-icon">🔧</div>
						<h3>Utility</h3>
						<p>
							Helpful commands for weather, translations, and more
						</p>
					</div>
				</div>
			</section>

			<section className="stats">
				<h2>Bot Stats</h2>
				<div className="stats-cards">
					<div className="stat-card">
						<h3>Servers</h3>
						<p className="stat-number">1,000+</p>
					</div>
					<div className="stat-card">
						<h3>Users</h3>
						<p className="stat-number">500,000+</p>
					</div>
					<div className="stat-card">
						<h3>Commands</h3>
						<p className="stat-number">100+</p>
					</div>
				</div>
			</section>
		</div>
	);
};

export default HomePage;
