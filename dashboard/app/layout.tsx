import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Kiyo Bot Dashboard',
	description: 'Dashboard for managing and monitoring Kiyo Discord Bot',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<div className="min-h-screen bg-gray-100">
					<nav className="bg-white shadow-lg">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex justify-between h-16">
								<div className="flex">
									<div className="flex-shrink-0 flex items-center">
										<h1 className="text-2xl font-bold text-indigo-600">
											Kiyo Dashboard
										</h1>
									</div>
								</div>
							</div>
						</div>
					</nav>

					<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
						<div className="flex gap-6">
							<div className="w-64 flex-shrink-0">
								<Navigation />
							</div>
							<div className="flex-1">
								<main>{children}</main>
							</div>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
