import { Card, Title, Text, Grid, Badge } from '@tremor/react';

const servers = [
	{
		name: 'Gaming Hub',
		members: 1250,
		status: 'active',
		region: 'US East',
		commands: 4567,
	},
	{
		name: 'Anime Club',
		members: 890,
		status: 'active',
		region: 'Europe',
		commands: 3456,
	},
	{
		name: 'Study Group',
		members: 456,
		status: 'active',
		region: 'Asia',
		commands: 2345,
	},
	{
		name: 'Music Lovers',
		members: 789,
		status: 'active',
		region: 'US West',
		commands: 3789,
	},
];

export default function Servers() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Servers</h1>
				<p className="mt-2 text-gray-600">
					Manage and monitor Discord servers
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6">
				{servers.map((server) => (
					<Card
						key={server.name}
						className="hover:bg-gray-50 transition-colors"
					>
						<div className="flex items-center justify-between">
							<div>
								<Title>{server.name}</Title>
								<div className="mt-2 space-y-1">
									<Text>
										Members:{' '}
										{server.members.toLocaleString()}
									</Text>
									<Text>Region: {server.region}</Text>
									<Text>
										Commands Used:{' '}
										{server.commands.toLocaleString()}
									</Text>
								</div>
							</div>
							<div className="flex flex-col items-end space-y-2">
								<Badge
									color={
										server.status === 'active'
											? 'emerald'
											: 'rose'
									}
									size="xl"
								>
									{server.status.toUpperCase()}
								</Badge>
								<button className="text-sm text-indigo-600 hover:text-indigo-900">
									Manage Server
								</button>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
