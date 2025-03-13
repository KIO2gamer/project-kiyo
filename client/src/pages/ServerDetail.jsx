import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
	FaUsers,
	FaCogs,
	FaChartBar,
	FaClock,
	FaExclamationTriangle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { getServerById, getServerStats } from '../services/serverService';
import '../styles/ServerDetail.css';

const ServerDetail = () => {
	const { id } = useParams();
	const { user, loading: authLoading } = useContext(AuthContext);

	const [server, setServer] = useState(null);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState('overview');
	const [timeframe, setTimeframe] = useState('7d');

	useEffect(() => {
		const fetchServerData = async () => {
			try {
				setLoading(true);
				setError(null);

				const serverData = await getServerById(id);
				setServer(serverData);

				if (activeTab === 'stats') {
					const statsData = await getServerStats(id, timeframe);
					setStats(statsData);
				}
			} catch (error) {
				console.error('Error fetching server data:', error);
				setError('Failed to load server data. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchServerData();
		}
	}, [id, user, activeTab, timeframe]);

	// Redirect if not authenticated
	if (!authLoading && !user) {
		return <Navigate to="/login" />;
	}

	if (authLoading || loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading server data...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="error-container">
				<FaExclamationTriangle className="error-icon" />
				<h2>Error</h2>
				<p>{error}</p>
				<button
					className="btn primary-btn"
					onClick={() => window.location.reload()}
				>
					Try Again
				</button>
			</div>
		);
	}

	if (!server) {
		return (
			<div className="error-container">
				<FaExclamationTriangle className="error-icon" />
				<h2>Server Not Found</h2>
				<p>The requested server could not be found.</p>
			</div>
		);
	}

	return (
		<div className="server-detail-page">
			<div className="server-header">
				<div className="server-identity">
					{server.icon ? (
						<img
							src={server.icon}
							alt={server.name}
							className="server-icon"
						/>
					) : (
						<div className="server-icon-placeholder">
							{server.name.charAt(0)}
						</div>
					)}

					<div className="server-info">
						<h1>{server.name}</h1>
						<div className="server-meta">
							<span>
								<FaUsers /> {server.memberCount} members
							</span>
							<span>
								<FaClock /> Created {server.createdAt.age} ago
							</span>
						</div>
					</div>
				</div>

				<div className="server-actions">
					<button className="btn secondary-btn">
						<FaCogs /> Settings
					</button>
					<a
						href={`https://discord.com/channels/${server.id}`}
						className="btn primary-btn"
						target="_blank"
						rel="noopener noreferrer"
					>
						Open in Discord
					</a>
				</div>
			</div>

			<div className="server-tabs">
				<button
					className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
					onClick={() => setActiveTab('overview')}
				>
					Overview
				</button>
				<button
					className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
					onClick={() => setActiveTab('stats')}
				>
					Statistics
				</button>
				<button
					className={`tab ${activeTab === 'channels' ? 'active' : ''}`}
					onClick={() => setActiveTab('channels')}
				>
					Channels
				</button>
				<button
					className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
					onClick={() => setActiveTab('roles')}
				>
					Roles
				</button>
			</div>

			<div className="server-content">
				{activeTab === 'overview' && (
					<div className="overview-tab">
						<div className="info-card">
							<h2>Server Information</h2>
							<div className="info-grid">
								<div className="info-item">
									<span className="info-label">ID</span>
									<span className="info-value">
										{server.id}
									</span>
								</div>
								<div className="info-item">
									<span className="info-label">Owner</span>
									<span className="info-value">
										{server.owner.tag}
									</span>
								</div>
								<div className="info-item">
									<span className="info-label">Region</span>
									<span className="info-value">
										{server.preferredLocale}
									</span>
								</div>
								<div className="info-item">
									<span className="info-label">Created</span>
									<span className="info-value">
										{server.createdAt.formatted}
									</span>
								</div>
								<div className="info-item">
									<span className="info-label">
										Verification Level
									</span>
									<span className="info-value">
										{server.verificationLevel}
									</span>
								</div>
								<div className="info-item">
									<span className="info-label">
										Boost Tier
									</span>
									<span className="info-value">
										Level {server.premiumTier || '0'}
									</span>
								</div>
							</div>

							{server.description && (
								<div className="server-description">
									<h3>Description</h3>
									<p>{server.description}</p>
								</div>
							)}

							{server.features.length > 0 && (
								<div className="server-features">
									<h3>Features</h3>
									<div className="feature-tags">
										{server.features.map(
											(feature, index) => (
												<span
													key={index}
													className="feature-tag"
												>
													{feature}
												</span>
											),
										)}
									</div>
								</div>
							)}
						</div>

						<div className="info-card">
							<h2>Channel Statistics</h2>
							<div className="channel-stats">
								<div className="channel-stat">
									<div className="stat-circle">
										{server.channels.text}
									</div>
									<span>Text</span>
								</div>
								<div className="channel-stat">
									<div className="stat-circle">
										{server.channels.voice}
									</div>
									<span>Voice</span>
								</div>
								<div className="channel-stat">
									<div className="stat-circle">
										{server.channels.categories}
									</div>
									<span>Categories</span>
								</div>
								<div className="channel-stat">
									<div className="stat-circle">
										{server.channels.announcement}
									</div>
									<span>Announcement</span>
								</div>
								<div className="channel-stat">
									<div className="stat-circle">
										{server.channels.forum}
									</div>
									<span>Forums</span>
								</div>
							</div>
						</div>

						<div className="info-card">
							<h2>Member Statistics</h2>
							<div className="member-stats">
								<div className="member-count">
									<h3>Total Members</h3>
									<p className="big-stat">
										{server.memberCount}
									</p>
								</div>
								{/* Add member charts or additional stats here */}
							</div>
						</div>
					</div>
				)}

				{activeTab === 'stats' && (
					<div className="stats-tab">
						<div className="stats-controls">
							<h2>Server Activity</h2>
							<div className="timeframe-selector">
								<span>Timeframe:</span>
								<select
									value={timeframe}
									onChange={(e) =>
										setTimeframe(e.target.value)
									}
								>
									<option value="24h">Last 24 Hours</option>
									<option value="7d">Last 7 Days</option>
									<option value="30d">Last 30 Days</option>
									<option value="1M">Last Month</option>
									<option value="all">All Time</option>
								</select>
							</div>
						</div>

						{stats ? (
							<>
								<div className="stats-overview">
									<div className="stat-box">
										<h3>Messages</h3>
										<p className="stat-value">
											{stats.activityBreakdown
												.messagesSent || 0}
										</p>
									</div>
									<div className="stat-box">
										<h3>New Members</h3>
										<p className="stat-value">
											{stats.overview.newMembers || 0}
										</p>
									</div>
									<div className="stat-box">
										<h3>Left Members</h3>
										<p className="stat-value">
											{stats.overview.membersLeft || 0}
										</p>
									</div>
									<div className="stat-box">
										<h3>Commands Used</h3>
										<p className="stat-value">
											{stats.activityBreakdown
												.commandsUsed || 0}
										</p>
									</div>
								</div>

								<div className="chart-container">
									<h3>Member Growth</h3>
									<div className="growth-chart">
										{/* Chart would go here - in a real app you'd use a library like Chart.js */}
										<div className="chart-placeholder">
											<p>
												Chart visualization would be
												displayed here
											</p>
											<p>
												Data points:{' '}
												{stats.growthChart.length}
											</p>
										</div>
									</div>
								</div>

								<div className="top-items">
									<h3>Top Channels</h3>
									<div className="top-channels">
										{stats.topChannels.length > 0 ? (
											stats.topChannels.map(
												(channel, index) => (
													<div
														className="top-item"
														key={channel.id}
													>
														<span className="item-rank">
															#{index + 1}
														</span>
														<span className="item-name">
															{channel.name}
														</span>
														<span className="item-count">
															{
																channel.messageCount
															}{' '}
															messages
														</span>
													</div>
												),
											)
										) : (
											<p className="no-data">
												No channel activity data
												available
											</p>
										)}
									</div>
								</div>
							</>
						) : (
							<div className="loading-stats">
								<div className="loading-spinner"></div>
								<p>Loading statistics...</p>
							</div>
						)}
					</div>
				)}

				{activeTab === 'channels' && (
					<div className="channels-tab">
						<h2>Server Channels</h2>
						<p className="coming-soon">
							Channel management features coming soon!
						</p>
					</div>
				)}

				{activeTab === 'roles' && (
					<div className="roles-tab">
						<h2>Server Roles</h2>
						<p className="coming-soon">
							Role management features coming soon!
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ServerDetail;
