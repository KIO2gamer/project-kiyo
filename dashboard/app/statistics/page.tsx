import { Card, Title, BarChart, DonutChart, Grid, Text } from '@tremor/react';

const commandStats = [
	{
		command: '!help',
		uses: 1234,
	},
	{
		command: '!play',
		uses: 987,
	},
	{
		command: '!ban',
		uses: 456,
	},
	{
		command: '!kick',
		uses: 345,
	},
	{
		command: '!mute',
		uses: 234,
	},
];

const serverActivityData = [
	{
		name: 'Active',
		servers: 85,
	},
	{
		name: 'Inactive',
		servers: 15,
	},
];

const weeklyStats = [
	{
		day: 'Mon',
		'Command Usage': 145,
		'New Users': 32,
	},
	{
		day: 'Tue',
		'Command Usage': 167,
		'New Users': 45,
	},
	{
		day: 'Wed',
		'Command Usage': 234,
		'New Users': 56,
	},
	{
		day: 'Thu',
		'Command Usage': 189,
		'New Users': 41,
	},
	{
		day: 'Fri',
		'Command Usage': 278,
		'New Users': 67,
	},
	{
		day: 'Sat',
		'Command Usage': 356,
		'New Users': 89,
	},
	{
		day: 'Sun',
		'Command Usage': 289,
		'New Users': 72,
	},
];

export default function Statistics() {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
				<p className="mt-1 text-sm text-gray-600">
					Detailed analytics and usage statistics
				</p>
			</div>

			<Grid numItems={1} numItemsSm={2} className="gap-4">
				<Card className="h-[250px]">
					<Title>Weekly Activity</Title>
					<BarChart
						className="h-[200px] mt-2"
						data={weeklyStats}
						index="day"
						categories={['Command Usage', 'New Users']}
						colors={['indigo', 'cyan']}
						yAxisWidth={40}
						showLegend={false}
					/>
				</Card>

				<Card className="h-[250px]">
					<Title>Server Status</Title>
					<DonutChart
						className="h-[200px] mt-2"
						data={serverActivityData}
						category="servers"
						index="name"
						colors={['emerald', 'rose']}
						showLabel={false}
					/>
				</Card>
			</Grid>

			<Card className="max-h-[250px] overflow-auto">
				<Title>Top Commands</Title>
				<div className="mt-2">
					{commandStats.map((stat) => (
						<div
							key={stat.command}
							className="flex items-center justify-between border-b border-gray-200 py-2 last:border-0"
						>
							<Text>{stat.command}</Text>
							<Text>{stat.uses.toLocaleString()} uses</Text>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
