import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Commands from './pages/Commands';
import ServerList from './pages/ServerList';
import ServerDetail from './pages/ServerDetail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
	return (
		<Router>
			<div className="app">
				<Navbar />
				<main className="container">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/commands" element={<Commands />} />
						<Route path="/servers" element={<ServerList />} />
						<Route path="/servers/:id" element={<ServerDetail />} />
						<Route path="/login" element={<Login />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</main>
				<Footer />
			</div>
		</Router>
	);
}

export default App;
