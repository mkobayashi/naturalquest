import { useState, useEffect } from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	Cell,
} from 'recharts';

const COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'];

const MOCK_STATS = {
	period: '30d',
	summary: { total_clicks: 0, total_conversions: 0, active_ads: 0 },
	by_advertiser: [],
	daily_clicks: [],
};

function formatYen(n) {
	return `¥${Number(n || 0).toLocaleString('ja-JP')}`;
}

function Badge({ type }) {
	const styles = {
		cpa: { bg: '#d4edda', color: '#155724', label: '成果報酬' },
		cpc: { bg: '#d1ecf1', color: '#0c5460', label: 'クリック課金' },
		hybrid: { bg: '#fff3cd', color: '#856404', label: 'ハイブリッド' },
		fixed: { bg: '#e2e3e5', color: '#383d41', label: '月額固定' },
	};
	const s = styles[type] || styles.fixed;
	return (
		<span
			style={{
				background: s.bg,
				color: s.color,
				padding: '2px 10px',
				borderRadius: 12,
				fontSize: 12,
				fontWeight: 600,
			}}
		>
			{s.label}
		</span>
	);
}

export default function AdDashboard() {
	const [stats, setStats] = useState(MOCK_STATS);
	const [period, setPeriod] = useState('30d');
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoadError(false);
		fetch(`/ads/stats?period=${encodeURIComponent(period)}`)
			.then((r) => {
				if (!r.ok) throw new Error(String(r.status));
				return r.json();
			})
			.then((data) => {
				if (!cancelled) setStats(data);
			})
			.catch(() => {
				if (!cancelled) {
					setLoadError(true);
					setStats(MOCK_STATS);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [period]);

	const rows = stats.by_advertiser || [];
	const totalRevenue = rows.reduce((s, a) => s + (a.estimated_revenue || 0), 0);
	const totalClicks = stats.summary?.total_clicks ?? 0;
	const totalCv = stats.summary?.total_conversions ?? 0;
	const cvRate =
		totalClicks > 0 ? ((totalCv / totalClicks) * 100).toFixed(1) : '0';

	return (
		<div
			style={{
				fontFamily: "'Noto Sans JP', 'Helvetica Neue', sans-serif",
				maxWidth: 900,
				margin: '0 auto',
				padding: 24,
				color: '#1a1a2e',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 32,
					flexWrap: 'wrap',
					gap: 12,
				}}
			>
				<div>
					<h1
						style={{
							fontSize: 22,
							fontWeight: 700,
							margin: 0,
							letterSpacing: '-0.02em',
						}}
					>
						naturalquest.org 広告レポート
					</h1>
					<p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
						自社アフィリエイト管理
						{loadError ? (
							<span style={{ color: '#b45309', marginLeft: 8 }}>
								（APIに接続できませんでした。Worker ルートと D1 を確認してください）
							</span>
						) : null}
					</p>
				</div>
				<div style={{ display: 'flex', gap: 6 }}>
					{['7d', '30d', '90d'].map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => setPeriod(p)}
							style={{
								padding: '6px 14px',
								borderRadius: 6,
								border: '1px solid #ddd',
								cursor: 'pointer',
								background: period === p ? '#2d6a4f' : '#fff',
								color: period === p ? '#fff' : '#333',
								fontSize: 13,
								fontWeight: 500,
							}}
						>
							{p === '7d' ? '7日' : p === '30d' ? '30日' : '90日'}
						</button>
					))}
				</div>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
					gap: 16,
					marginBottom: 32,
				}}
			>
				{[
					{ label: '推定売上', value: formatYen(totalRevenue), sub: '期間内' },
					{
						label: 'クリック数',
						value: totalClicks.toLocaleString('ja-JP'),
						sub: `${period}間`,
					},
					{
						label: 'コンバージョン',
						value: String(totalCv),
						sub: `CVR ${cvRate}%`,
					},
					{
						label: '稼働広告',
						value: stats.summary?.active_ads ?? 0,
						sub: `${rows.length}社`,
					},
				].map((kpi, i) => (
					<div
						key={i}
						style={{
							background: '#f8faf9',
							borderRadius: 10,
							padding: '18px 20px',
							border: '1px solid #e8ede9',
						}}
					>
						<div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{kpi.label}</div>
						<div style={{ fontSize: 26, fontWeight: 700, color: '#2d6a4f' }}>{kpi.value}</div>
						<div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{kpi.sub}</div>
					</div>
				))}
			</div>

			<div
				style={{
					background: '#fff',
					borderRadius: 10,
					border: '1px solid #e8ede9',
					padding: '20px 20px 12px',
					marginBottom: 28,
				}}
			>
				<h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#333' }}>
					日別クリック推移
				</h3>
				<ResponsiveContainer width="100%" height={180}>
					<LineChart data={stats.daily_clicks || []}>
						<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d?.slice?.(5) ?? d} />
						<YAxis tick={{ fontSize: 10 }} width={30} />
						<Tooltip
							contentStyle={{ fontSize: 12, borderRadius: 6 }}
							labelFormatter={(d) => d}
							formatter={(v) => [`${v} clicks`]}
						/>
						<Line type="monotone" dataKey="clicks" stroke="#2d6a4f" strokeWidth={2} dot={false} />
					</LineChart>
				</ResponsiveContainer>
			</div>

			<div
				style={{
					background: '#fff',
					borderRadius: 10,
					border: '1px solid #e8ede9',
					padding: '20px 20px 12px',
					marginBottom: 28,
				}}
			>
				<h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#333' }}>
					広告主別 売上
				</h3>
				{rows.length > 0 ? (
					<ResponsiveContainer width="100%" height={140}>
						<BarChart data={rows} layout="vertical">
							<XAxis
								type="number"
								tick={{ fontSize: 10 }}
								tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
							/>
							<YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
							<Tooltip formatter={(v) => formatYen(v)} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
							<Bar dataKey="estimated_revenue" radius={[0, 4, 4, 0]}>
								{rows.map((_, i) => (
									<Cell key={i} fill={COLORS[i % COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<p style={{ color: '#888', fontSize: 13 }}>データがありません</p>
				)}
			</div>

			<div
				style={{
					background: '#fff',
					borderRadius: 10,
					border: '1px solid #e8ede9',
					overflow: 'hidden',
				}}
			>
				<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
					<thead>
						<tr style={{ background: '#f8faf9' }}>
							{['広告主', '契約形態', 'クリック', 'CV', 'CVR', '推定売上'].map((h) => (
								<th
									key={h}
									style={{
										padding: '10px 14px',
										textAlign: 'left',
										fontWeight: 600,
										borderBottom: '1px solid #e8ede9',
										color: '#555',
									}}
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, i) => (
							<tr
								key={row.id}
								style={{
									borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
								}}
							>
								<td style={{ padding: '12px 14px', fontWeight: 500 }}>{row.name}</td>
								<td style={{ padding: '12px 14px' }}>
									<Badge type={row.contract_type} />
								</td>
								<td style={{ padding: '12px 14px' }}>{(row.clicks ?? 0).toLocaleString('ja-JP')}</td>
								<td style={{ padding: '12px 14px' }}>{row.conversions ?? 0}</td>
								<td style={{ padding: '12px 14px' }}>
									{row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(1) : 0}%
								</td>
								<td style={{ padding: '12px 14px', fontWeight: 600, color: '#2d6a4f' }}>
									{formatYen(row.estimated_revenue)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p style={{ textAlign: 'center', color: '#bbb', fontSize: 11, marginTop: 24 }}>
				naturalquest.org Ad System — Cloudflare Workers + D1
			</p>
		</div>
	);
}
