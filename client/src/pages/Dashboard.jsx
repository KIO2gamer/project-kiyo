import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaServer, FaChartLine, FaUserFriends, FaCode } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { getServers } from '../services/serverService';
import '../styles/Dashboard.css';

const Dashboard = () => {
	const { user, loading } = useContext(AuthContext);
	const [servers, setServers] = useState([]);
	const [stats, setStats] = useState({
		totalServers: 0,
		totalUsers: 0,
		totalCommands: 0,
	});
	const [serverLoading, setServerLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			if (!user) return;

			try {
				setServerLoading(true);
				const serverData = await getServers();
				setServers(serverData);

				// Calculate some basic stats
				const totalUsers = serverData.reduce(
					(acc, server) => acc + server.memberCount,
					0,
				);

				setStats({
					totalServers: serverData.length,
					totalUsers,
					totalCommands: 0, // This would come from a different API endpoint
				});
			} catch (error) {
				console.error('Failed to fetch dashboard data:', error);
			} finally {
				setServerLoading(false);
			}
		};

		fetchData();
	}, [user]);

	// If not authenticated, redirect to login
	if (!loading && !user) {
		return <Navigate to="/login" />;
	}

	if (loading || serverLoading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading your dashboard...</p>
			</div>
		);
	}

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<h1>Welcome, {user.username}!</h1>
				<p>Manage your Discord servers and bot settings</p>
			</div>

			<div className="dashboard-stats">
				<div className="stat-card">
					<FaServer className="stat-icon" />
					<div className="stat-info">
						<h3>Servers</h3>
						<p>{stats.totalServers}</p>
					</div>
				</div>

				<div className="stat-card">
					<FaUserFriends className="stat-icon" />
					<div className="stat-info">
						<h3>Users</h3>
						<p>{stats.totalUsers.toLocaleString()}</p>
					</div>
				</div>

				<div className="stat-card">
					<FaCode className="stat-icon" />
					<div className="stat-info">
						<h3>Commands</h3>
						<p>{stats.totalCommands}</p>
					</div>
				</div>

				<div className="stat-card">
					<FaChartLine className="stat-icon" />
					<div className="stat-info">
						<h3>Uptime</h3>
						<p>99.9%</p>
					</div>
				</div>
			</div>

			<div className="dashboard-section">
				<div className="section-header">
					<h2>Your Servers</h2>
					<Link to="/servers" className="view-all">
						View All
					</Link>
				</div>

				<div className="servers-grid">
					{servers.length > 0 ? (
						servers.slice(0, 8).map((server) => (
							<Link
								to={`/servers/${server.id}`}
								key={server.id}
								className="server-card"
							>
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
									<h3>{server.name}</h3>
									<p>{server.memberCount} members</p>
								</div>
							</Link>
						))
					) : (
						<div className="no-servers">
							<p>
								No servers found. Add Kiyo to your Discord
								server to get started!
							</p>
							<a
								href={`https://discord.com/oauth2/authorize?client_id=${process.env.REACT_APP_DISCORD_CLIENT_ID}&scope=bot&permissions=8`}
								className="btn primary-btn"
								target="_blank"
								rel="noopener noreferrer"
							>
								Add to Discord
							</a>
						</div>
					)}
				</div>
			</div>

			<div className="dashboard-section">
				<div className="section-header">
					<h2>Recent Activity</h2>
				</div>

				<div className="activity-list">
					<p className="no-activity">
						No recent activity to display.
					</p>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
