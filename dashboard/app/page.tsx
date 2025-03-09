import { Card, Title, Text, Grid, Metric, AreaChart } from '@tremor/react';

const stats = [
	{
		title: 'Total Servers',
		metric: '125',
		description: 'Active Discord servers',
	},
	{
		title: 'Total Users',
		metric: '15.4K',
		description: 'Unique users reached',
	},
	{
		title: 'Commands Used',
		metric: '89.2K',
		description: 'Total commands executed',
	},
];

const chartdata = [
	{
		date: 'Jan',
		Commands: 2890,
		Users: 2400,
	},
	{
		date: 'Feb',
		Commands: 3890,
		Users: 2800,
	},
	{
		date: 'Mar',
		Commands: 4200,
		Users: 3300,
	},
];

export default function Home() {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">
					Dashboard Overview
				</h1>
				<p className="mt-1 text-sm text-gray-600">
					Monitor your bot's performance and usage statistics.
				</p>
			</div>

			<Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
				{stats.map((item) => (
					<Card key={item.title} className="h-[120px]">
						<Text className="text-sm">{item.title}</Text>
						<Metric className="mt-1">{item.metric}</Metric>
						<Text className="mt-1 text-xs text-gray-500">
							{item.description}
						</Text>
					</Card>
				))}
			</Grid>

			<Card className="h-[250px]">
				<Title>Usage Trends</Title>
				<AreaChart
					className="h-[180px] mt-2"
					data={chartdata}
					index="date"
					categories={['Commands', 'Users']}
					colors={['indigo', 'cyan']}
					showLegend={false}
					showYAxis={false}
					showGridLines={false}
				/>
			</Card>

			<Grid numItems={1} numItemsSm={2} className="gap-4">
				<Card className="h-[200px] overflow-auto">
					<Title>Recent Commands</Title>
					<div className="mt-2">
						<div className="space-y-2">
							{['!help', '!play', '!ban'].map((cmd) => (
								<div
									key={cmd}
									className="flex items-center justify-between"
								>
									<Text className="text-sm">{cmd}</Text>
									<Text className="text-xs text-gray-500">
										2 mins ago
									</Text>
								</div>
							))}
						</div>
					</div>
				</Card>

				<Card className="h-[200px] overflow-auto">
					<Title>Top Servers</Title>
					<div className="mt-2">
						<div className="space-y-2">
							{['Gaming Hub', 'Anime Club', 'Study Group'].map(
								(server) => (
									<div
										key={server}
										className="flex items-center justify-between"
									>
										<Text className="text-sm">
											{server}
										</Text>
										<Text className="text-xs text-gray-500">
											250 members
										</Text>
									</div>
								),
							)}
						</div>
					</div>
				</Card>
			</Grid>
		</div>
	);
}
