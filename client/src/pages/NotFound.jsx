import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import '../styles/NotFound.css';

const NotFound = () => {
	return (
		<div className="not-found">
			<div className="not-found-content">
				<FaExclamationTriangle className="not-found-icon" />
				<h1>404</h1>
				<h2>Page Not Found</h2>
				<p>
					Oops! The page you're looking for doesn't exist or has been
					moved.
				</p>

				<div className="not-found-actions">
					<button
						className="btn secondary-btn"
						onClick={() => window.history.back()}
					>
						<FaArrowLeft /> Go Back
					</button>
					<Link to="/" className="btn primary-btn">
						<FaHome /> Home
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
