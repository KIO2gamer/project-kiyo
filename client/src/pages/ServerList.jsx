import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
	FaSearch,
	FaFilter,
	FaSort,
	FaExclamationCircle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { getServers } from '../services/serverService';
import '../styles/ServerList.css';

const ServerList = () => {
	const { user, loading: authLoading } = useContext(AuthContext);
	const [servers, setServers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('name');
	const [sortOrder, setSortOrder] = useState('asc');

	useEffect(() => {
		const fetchServers = async () => {
			try {
				setLoading(true);
				setError(null);
				const serverData = await getServers();
				setServers(serverData);
			} catch (error) {
				console.error('Error fetching servers:', error);
				setError('Failed to load servers. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchServers();
		}
	}, [user]);

	// Redirect if not authenticated or not admin
	if (!authLoading && (!user || !user.isAdmin)) {
		return <Navigate to="/login" />;
	}

	// Filter servers based on search term
	const filteredServers = servers.filter((server) =>
		server.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Sort servers
	const sortedServers = [...filteredServers].sort((a, b) => {
		let comparison = 0;

		switch (sortBy) {
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'memberCount':
				comparison = a.memberCount - b.memberCount;
				break;
			case 'joinedAt':
				comparison = new Date(a.joinedAt) - new Date(b.joinedAt);
				break;
			default:
				comparison = 0;
		}

		return sortOrder === 'asc' ? comparison : -comparison;
	});

	const toggleSort = (field) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortOrder('asc');
		}
	};

	if (authLoading || loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading servers...</p>
			</div>
		);
	}

	return (
		<div className="server-list-page">
			<div className="server-list-header">
				<h1>Manage Servers</h1>
				<div className="server-controls">
					<div className="search-container">
						<FaSearch className="search-icon" />
						<input
							type="text"
							placeholder="Search servers..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<div className="filter-sort">
						<button className="filter-btn">
							<FaFilter /> Filter
						</button>
						<button
							className="sort-btn"
							onClick={() => toggleSort('memberCount')}
						>
							<FaSort /> Sort by{' '}
							{sortBy === 'memberCount'
								? sortOrder === 'asc'
									? '↑'
									: '↓'
								: ''}
						</button>
					</div>
				</div>
			</div>

			{error && (
				<div className="error-message">
					<FaExclamationCircle /> {error}
				</div>
			)}

			<div className="servers-grid list-view">
				{sortedServers.length > 0 ? (
					sortedServers.map((server) => (
						<Link
							to={`/servers/${server.id}`}
							key={server.id}
							className="server-list-item"
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
								<div className="server-metadata">
									<span>{server.memberCount} members</span>
									<span>Owner: {server.owner.tag}</span>
								</div>
							</div>

							<div className="server-features">
								{server.features
									.slice(0, 3)
									.map((feature, index) => (
										<span
											key={index}
											className="feature-tag"
										>
											{feature}
										</span>
									))}
								{server.features.length > 3 && (
									<span className="feature-tag more">
										+{server.features.length - 3} more
									</span>
								)}
							</div>
						</Link>
					))
				) : (
					<div className="no-servers">
						<p>
							{searchTerm
								? `No servers found matching "${searchTerm}"`
								: 'No servers found. Add the bot to some Discord servers!'}
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
	);
};

export default ServerList;
