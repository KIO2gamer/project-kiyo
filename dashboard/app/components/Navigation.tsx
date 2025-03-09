'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	HomeIcon,
	ChartBarIcon,
	ServerIcon,
	CommandLineIcon,
	Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
	{ name: 'Overview', href: '/', icon: HomeIcon },
	{ name: 'Statistics', href: '/statistics', icon: ChartBarIcon },
	{ name: 'Servers', href: '/servers', icon: ServerIcon },
	{ name: 'Commands', href: '/commands', icon: CommandLineIcon },
	{ name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Navigation() {
	const pathname = usePathname();

	return (
		<nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm">
			{navigation.map((item) => {
				const isActive = pathname === item.href;
				return (
					<Link
						key={item.name}
						href={item.href}
						className={`
              group flex items-center px-3 py-2 text-sm font-medium rounded-md
              ${
					isActive
						? 'bg-indigo-100 text-indigo-600'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
				}
            `}
					>
						<item.icon
							className={`
                mr-3 h-6 w-6
                ${
					isActive
						? 'text-indigo-600'
						: 'text-gray-400 group-hover:text-gray-500'
				}
              `}
							aria-hidden="true"
						/>
						{item.name}
					</Link>
				);
			})}
		</nav>
	);
}
