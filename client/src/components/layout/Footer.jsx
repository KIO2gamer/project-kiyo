import React from 'react';
import { Link } from 'react-router-dom';
import { FaDiscord, FaGithub, FaTwitter, FaHeart } from 'react-icons/fa';
import '../../styles/Footer.css';

const Footer = () => {
	const year = new Date().getFullYear();

	return (
		<footer className="footer">
			<div className="footer-container">
				<div className="footer-row">
					<div className="footer-column">
						<h3>Project Kiyo</h3>
						<p className="footer-description">
							A powerful Discord bot with web dashboard built with
							the MERN stack.
						</p>
						<div className="footer-social">
							<a
								href="https://discord.gg/yourserver"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Discord"
							>
								<FaDiscord />
							</a>
							<a
								href="https://github.com/KIO2gamer/project-kiyo"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="GitHub"
							>
								<FaGithub />
							</a>
							<a
								href="https://twitter.com/yourhandle"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Twitter"
							>
								<FaTwitter />
							</a>
						</div>
					</div>

					<div className="footer-column">
						<h4>Links</h4>
						<ul className="footer-links">
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								<Link to="/commands">Commands</Link>
							</li>
							<li>
								<Link to="/dashboard">Dashboard</Link>
							</li>
							<li>
								<Link to="/privacy">Privacy Policy</Link>
							</li>
							<li>
								<Link to="/terms">Terms of Service</Link>
							</li>
						</ul>
					</div>

					<div className="footer-column">
						<h4>Resources</h4>
						<ul className="footer-links">
							<li>
								<a
									href="https://discord.js.org/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Discord.js
								</a>
							</li>
							<li>
								<a
									href="https://reactjs.org/"
									target="_blank"
									rel="noopener noreferrer"
								>
									React
								</a>
							</li>
							<li>
								<a
									href="https://expressjs.com/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Express
								</a>
							</li>
							<li>
								<a
									href="https://www.mongodb.com/"
									target="_blank"
									rel="noopener noreferrer"
								>
									MongoDB
								</a>
							</li>
							<li>
								<a
									href="https://nodejs.org/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Node.js
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="footer-bottom">
					<p>&copy; {year} Project Kiyo. All rights reserved.</p>
					<p>
						Made with <FaHeart className="heart-icon" /> by
						KIO2gamer
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
