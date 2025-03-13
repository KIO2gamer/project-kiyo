import React, { useState, useEffect } from 'react';
import { getAllCommands } from '../services/commandService';
import '../styles/Commands.css';

const Commands = () => {
	const [commands, setCommands] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeCategory, setActiveCategory] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		const fetchCommands = async () => {
			try {
				setLoading(true);
				const commandData = await getAllCommands();
				setCommands(commandData);
			} catch (error) {
				console.error('Failed to fetch commands:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchCommands();
	}, []);

	// Get unique categories
	const categories = ['all', ...new Set(commands.map((cmd) => cmd.category))];

	// Filter commands based on category and search term
	const filteredCommands = commands.filter((cmd) => {
		const matchesCategory =
			activeCategory === 'all' || cmd.category === activeCategory;
		const matchesSearch =
			cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading commands...</p>
			</div>
		);
	}

	return (
		<div className="commands-page">
			<div className="commands-header">
				<h1>Bot Commands</h1>
				<p>Explore all available commands for Project Kiyo</p>

				<div className="commands-search">
					<input
						type="text"
						placeholder="Search commands..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className="category-tabs">
				{categories.map((category) => (
					<button
						key={category}
						className={`category-tab ${activeCategory === category ? 'active' : ''}`}
						onClick={() => setActiveCategory(category)}
					>
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</button>
				))}
			</div>

			<div className="commands-container">
				{filteredCommands.length > 0 ? (
					filteredCommands.map((command) => (
						<div className="command-card" key={command.name}>
							<div className="command-header">
								<h3>/{command.name}</h3>
								<span className="command-category">
									{command.category}
								</span>
							</div>
							<p className="command-description">
								{command.description}
							</p>

							{command.usage && (
								<div className="command-usage">
									<h4>Usage:</h4>
									<code>{command.usage}</code>
								</div>
							)}

							{command.examples &&
								command.examples.length > 0 && (
									<div className="command-examples">
										<h4>Examples:</h4>
										<ul>
											{command.examples.map(
												(example, index) => (
													<li key={index}>
														<code>{example}</code>
													</li>
												),
											)}
										</ul>
									</div>
								)}
						</div>
					))
				) : (
					<div className="no-commands">
						<p>No commands found matching your criteria.</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Commands;
