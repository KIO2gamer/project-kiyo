import { Card, Title, Text, Badge } from '@tremor/react';

const commands = [
	{
		name: '!help',
		category: 'General',
		description: 'Shows the list of available commands',
		usage: '!help [command]',
		cooldown: '5s',
		enabled: true,
	},
	{
		name: '!play',
		category: 'Music',
		description: 'Plays a song from YouTube or Spotify',
		usage: '!play <song name/URL>',
		cooldown: '3s',
		enabled: true,
	},
	{
		name: '!ban',
		category: 'Moderation',
		description: 'Bans a user from the server',
		usage: '!ban <@user> [reason]',
		cooldown: '0s',
		enabled: true,
	},
	{
		name: '!kick',
		category: 'Moderation',
		description: 'Kicks a user from the server',
		usage: '!kick <@user> [reason]',
		cooldown: '0s',
		enabled: true,
	},
	{
		name: '!mute',
		category: 'Moderation',
		description: 'Mutes a user in the server',
		usage: '!mute <@user> [duration] [reason]',
		cooldown: '0s',
		enabled: true,
	},
];

const categoryColors = {
	General: 'blue',
	Music: 'purple',
	Moderation: 'rose',
	Fun: 'amber',
	Utility: 'emerald',
} as const;

export default function Commands() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Commands</h1>
				<p className="mt-2 text-gray-600">
					View and manage bot commands
				</p>
			</div>

			<div className="space-y-4">
				{commands.map((command) => (
					<Card
						key={command.name}
						className="hover:bg-gray-50 transition-colors"
					>
						<div className="flex items-start justify-between">
							<div className="space-y-3">
								<div className="flex items-center space-x-3">
									<Title>{command.name}</Title>
									<Badge
										color={
											categoryColors[
												command.category as keyof typeof categoryColors
											]
										}
										size="sm"
									>
										{command.category}
									</Badge>
									{command.enabled ? (
										<Badge color="emerald" size="sm">
											Enabled
										</Badge>
									) : (
										<Badge color="rose" size="sm">
											Disabled
										</Badge>
									)}
								</div>
								<Text>{command.description}</Text>
								<div className="space-y-1">
									<Text className="text-sm">
										<span className="font-medium">
											Usage:
										</span>{' '}
										{command.usage}
									</Text>
									<Text className="text-sm">
										<span className="font-medium">
											Cooldown:
										</span>{' '}
										{command.cooldown}
									</Text>
								</div>
							</div>
							<button className="text-sm text-indigo-600 hover:text-indigo-900">
								Edit Command
							</button>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
