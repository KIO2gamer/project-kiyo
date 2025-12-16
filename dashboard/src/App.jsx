import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import {
    Activity,
    BarChart3,
    Bot,
    CheckCircle2,
    FileText,
    Globe,
    Home,
    LogIn,
    LogOut,
    RefreshCw,
    Save,
    Server,
    Settings,
    Shield,
    ShieldCheck,
    Sparkles,
    Users,
    Wand2,
    Wrench,
    XCircle,
} from "lucide-react";
import api from "./api";

function SectionCard({ title, description, actions, children }) {
    return (
        <div className="rounded-2xl bg-ink-900/70 border border-ink-800/70 shadow-glow p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-ink-400">{title}</p>
                    {description && <p className="text-ink-200 text-sm mt-1">{description}</p>}
                </div>
                {actions}
            </div>
            {children}
        </div>
    );
}

function Field({ label, children, hint }) {
    return (
        <label className="flex flex-col gap-2">
            <span className="text-sm text-ink-200 font-medium">{label}</span>
            {children}
            {hint && <span className="text-xs text-ink-400">{hint}</span>}
        </label>
    );
}

function Tag({ children }) {
    return (
        <span className="px-2 py-1 text-xs rounded-full bg-ink-800 text-ink-100 border border-ink-700">
            {children}
        </span>
    );
}

function Button({ variant = "solid", children, icon: Icon, ...rest }) {
    const base =
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-jade-400/60 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        solid: "bg-gradient-to-r from-jade-500 to-ember-500 text-white shadow-lg shadow-ember-900/20 hover:-translate-y-0.5",
        ghost: "bg-ink-800/80 text-ink-100 hover:bg-ink-700",
        outline: "border border-ink-600 text-ink-100 hover:border-jade-400 hover:text-jade-100",
    };

    return (
        <button className={`${base} ${variants[variant]}`} {...rest}>
            {Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
}

const initialCommand = { name: "", message: "", alias_name: "" };

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

function AppContent() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [guilds, setGuilds] = useState([]);
    const [selectedGuild, setSelectedGuild] = useState(null);
    const [settings, setSettings] = useState(null);
    const [customCommands, setCustomCommands] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [commandDraft, setCommandDraft] = useState(initialCommand);
    const [commandBusy, setCommandBusy] = useState(false);

    const ready = Boolean(user && selectedGuild && settings);

    const statusSummary = useMemo(() => {
        if (!settings?.status) return null;
        return [
            { label: "Ping", value: `${Math.round(settings.status.ping)} ms` },
            { label: "Uptime", value: `${Math.floor((settings.status.uptimeMs || 0) / 3600000)}h` },
            { label: "Guilds", value: settings.status.guildCount || 0 },
        ];
    }, [settings]);

    async function loadSession() {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/me");
            setUser(data.user);
            setGuilds(data.guilds || []);
            if (data.guilds?.length) {
                await selectGuild(data.guilds[0].id);
            }
        } catch (err) {
            setUser(null);
            setGuilds([]);
            setSettings(null);
        } finally {
            setLoading(false);
        }
    }

    async function selectGuild(guildId) {
        setSelectedGuild(guildId);
        setSettings(null);
        setCustomCommands([]);
        setError(null);
        try {
            const [settingsResp, cmdsResp] = await Promise.all([
                api.get(`/guilds/${guildId}/settings`),
                api.get(`/guilds/${guildId}/custom-commands`),
            ]);
            setSettings(settingsResp.data);
            setCustomCommands(cmdsResp.data.commands || []);
        } catch (err) {
            setError("Failed to load guild settings");
        }
    }

    async function saveSettings() {
        if (!selectedGuild || !settings) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                welcome: settings.welcome,
                aiChatChannelId: settings.aiChatChannelId || null,
                modLogChannelId: settings.modLogChannelId || null,
                msgLogChannelId: settings.msgLogChannelId || null,
                ticketCategoryId: settings.ticketCategoryId || null,
                xp: settings.xp,
                ytSubRoleConfig: settings.ytSubRoleConfig,
            };
            const { data } = await api.put(`/guilds/${selectedGuild}/settings`, payload);
            setSettings(data);
        } catch (err) {
            setError("Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function logout() {
        await api.post("/auth/logout").catch(() => {});
        setUser(null);
        setGuilds([]);
        setSettings(null);
        setSelectedGuild(null);
    }

    async function addCommand() {
        if (!selectedGuild) return;
        setCommandBusy(true);
        setError(null);
        try {
            const payload = {
                ...commandDraft,
                alias_name: commandDraft.alias_name?.trim() || undefined,
            };
            const { data } = await api.post(`/guilds/${selectedGuild}/custom-commands`, payload);
            setCustomCommands(data.commands || []);
            setCommandDraft(initialCommand);
        } catch (err) {
            setError(err.response?.data?.error || "Could not add command");
        } finally {
            setCommandBusy(false);
        }
    }

    async function deleteCommand(id) {
        setCommandBusy(true);
        setError(null);
        try {
            const { data } = await api.delete(`/guilds/${selectedGuild}/custom-commands/${id}`);
            setCustomCommands(data.commands || []);
        } catch (err) {
            setError("Could not delete command");
        } finally {
            setCommandBusy(false);
        }
    }

    useEffect(() => {
        loadSession();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-ink-100 bg-ink-900">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-3 text-sm">Booting dashboard...</span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <div className="max-w-md space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-ink-800/80 rounded-full border border-ink-700 text-ink-100">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs font-semibold tracking-wide uppercase">
                            Project Kiyo
                        </span>
                    </div>
                    <h1 className="text-4xl font-semibold text-ink-50">
                        Control your bot visually.
                    </h1>
                    <p className="text-ink-200">
                        Sign in with Discord to manage channels, welcome flows, AI chat, XP, logs,
                        and YouTube subscriber roles from a single pane.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            icon={LogIn}
                            onClick={() => (window.location.href = "/api/auth/login")}
                        >
                            Login with Discord
                        </Button>
                        <Button
                            variant="ghost"
                            icon={Globe}
                            onClick={() =>
                                window.open("https://discord.com/developers/applications", "_blank")
                            }
                        >
                            Get Client ID
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <Sidebar
                user={user}
                guilds={guilds}
                selectedGuild={selectedGuild}
                selectGuild={selectGuild}
                logout={logout}
            />

            <main className="flex-1 p-8 space-y-6">
                <Header
                    selectedGuild={selectedGuild}
                    guilds={guilds}
                    statusSummary={statusSummary}
                    ready={ready}
                    saving={saving}
                    saveSettings={saveSettings}
                />

                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 border border-ember-400/50 bg-ember-500/10 text-ember-100 rounded-xl">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {!ready && (
                    <div className="text-ink-300 text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>Select a guild to load settings.</span>
                    </div>
                )}

                {ready && (
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <OverviewPage
                                    settings={settings}
                                    setSettings={setSettings}
                                    selectedGuild={selectedGuild}
                                />
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <AnalyticsPage settings={settings} selectedGuild={selectedGuild} />
                            }
                        />
                        <Route
                            path="/moderation"
                            element={
                                <ModerationPage settings={settings} setSettings={setSettings} />
                            }
                        />
                        <Route
                            path="/roles"
                            element={<RolesPage settings={settings} setSettings={setSettings} />}
                        />
                        <Route
                            path="/commands"
                            element={
                                <CommandsPage
                                    customCommands={customCommands}
                                    commandDraft={commandDraft}
                                    setCommandDraft={setCommandDraft}
                                    commandBusy={commandBusy}
                                    addCommand={addCommand}
                                    deleteCommand={deleteCommand}
                                />
                            }
                        />
                        <Route path="/logs" element={<LogsPage selectedGuild={selectedGuild} />} />
                    </Routes>
                )}
            </main>
        </div>
    );
}

function Sidebar({ user, guilds, selectedGuild, selectGuild, logout }) {
    const location = useLocation();

    const navItems = [
        { path: "/", icon: Home, label: "Overview" },
        { path: "/analytics", icon: BarChart3, label: "Analytics" },
        { path: "/moderation", icon: Shield, label: "Moderation" },
        { path: "/roles", icon: Users, label: "Roles" },
        { path: "/commands", icon: Wand2, label: "Commands" },
        { path: "/logs", icon: FileText, label: "Logs" },
    ];

    return (
        <aside className="w-72 border-r border-ink-800/80 bg-ink-900/70 backdrop-blur px-6 py-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-jade-500 to-ember-500 flex items-center justify-center text-white font-bold">
                    PK
                </div>
                <div>
                    <p className="text-ink-100 font-semibold">{user.username}</p>
                    <p className="text-ink-400 text-xs">{user.id}</p>
                </div>
            </div>

            <nav className="space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                            location.pathname === item.path
                                ? "bg-jade-500/15 text-jade-100 border border-jade-500/30"
                                : "text-ink-300 hover:bg-ink-800/50 hover:text-ink-100"
                        }`}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.25em] text-ink-500">Guilds</p>
                    <Tag>{guilds.length} linked</Tag>
                </div>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {guilds.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => selectGuild(g.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                                selectedGuild === g.id
                                    ? "border-jade-400/70 bg-jade-500/10 text-ink-50"
                                    : "border-ink-800 bg-ink-900/60 text-ink-200 hover:border-ink-600"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{g.name}</span>
                                {selectedGuild === g.id && (
                                    <CheckCircle2 className="h-4 w-4 text-jade-400" />
                                )}
                            </div>
                        </button>
                    ))}
                    {!guilds.length && (
                        <p className="text-ink-400 text-sm">Add the bot to a server you manage.</p>
                    )}
                </div>
            </div>

            <div className="mt-auto space-y-3">
                <Button variant="ghost" icon={LogOut} onClick={logout}>
                    Logout
                </Button>
                <p className="text-xs text-ink-500">Dashboard v0.2 · Multi-page</p>
            </div>
        </aside>
    );
}

function Header({ selectedGuild, guilds, statusSummary, ready, saving, saveSettings }) {
    const location = useLocation();

    const pageTitles = {
        "/": "Overview",
        "/analytics": "Analytics & Stats",
        "/moderation": "Moderation",
        "/roles": "Role Management",
        "/commands": "Custom Commands",
        "/logs": "Activity Logs",
    };

    return (
        <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
                <p className="text-xs uppercase tracking-[0.25em] text-ink-500">
                    {pageTitles[location.pathname] || "Dashboard"}
                </p>
                <h1 className="text-2xl font-semibold text-ink-50">
                    {selectedGuild
                        ? `${guilds.find((g) => g.id === selectedGuild)?.name || ""}`
                        : "Select a guild"}
                </h1>
            </div>
            <div className="flex items-center gap-3">
                {statusSummary &&
                    statusSummary.map((item) => (
                        <div
                            key={item.label}
                            className="px-3 py-2 rounded-xl bg-ink-800/70 border border-ink-700 text-sm text-ink-100"
                        >
                            <p className="text-xs uppercase tracking-wide text-ink-400">
                                {item.label}
                            </p>
                            <p className="font-semibold">{item.value}</p>
                        </div>
                    ))}
                <Button icon={Save} onClick={saveSettings} disabled={!ready || saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
}

// ==================== OVERVIEW PAGE ====================
function OverviewPage({ settings, setSettings, selectedGuild }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard
                title="Channels"
                description="Control AI chat, welcome, logging, and tickets."
                actions={<Tag>Scope: {selectedGuild}</Tag>}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="AI Chat Channel ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.aiChatChannelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    aiChatChannelId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <Field label="Moderation Log Channel ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.modLogChannelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    modLogChannelId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <Field label="Message Log Channel ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.msgLogChannelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    msgLogChannelId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <Field label="Ticket Category ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.ticketCategoryId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    ticketCategoryId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                </div>
            </SectionCard>

            <SectionCard
                title="Welcome"
                description="Configure join message and target channel."
                actions={
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-ink-100">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-ink-600 bg-ink-800"
                                checked={settings.welcome?.enabled || false}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        welcome: {
                                            ...prev.welcome,
                                            enabled: e.target.checked,
                                        },
                                    }))
                                }
                            />
                            Enable
                        </label>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Field label="Welcome Channel ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.welcome?.channelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    welcome: {
                                        ...prev.welcome,
                                        channelId: e.target.value,
                                    },
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <Field label="Welcome Message" hint="Use {user} and {server} placeholders.">
                        <textarea
                            rows={4}
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.welcome?.message || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    welcome: {
                                        ...prev.welcome,
                                        message: e.target.value,
                                    },
                                }))
                            }
                        />
                    </Field>
                </div>
            </SectionCard>

            <SectionCard
                title="XP & Leveling"
                description="Toggle leveling and adjust the XP multiplier."
                actions={
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-ink-100">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-ink-600 bg-ink-800"
                                checked={settings.xp?.enabled || false}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        xp: { ...prev.xp, enabled: e.target.checked },
                                    }))
                                }
                            />
                            Enabled
                        </label>
                        <Tag>Base rate</Tag>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-3">
                    <Field label="XP Multiplier (0 - 10)">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.xp?.baseRate ?? 1}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    xp: {
                                        ...prev.xp,
                                        baseRate: Number(e.target.value),
                                    },
                                }))
                            }
                        />
                    </Field>
                </div>
            </SectionCard>

            <SectionCard
                title="Diagnostics"
                description="Quick state of the bot."
                actions={<Tag>Live</Tag>}
            >
                <div className="grid grid-cols-2 gap-3">
                    <DiagItem icon={Bot} label="Bot" value={settings.status.botTag || "Bot"} />
                    <DiagItem icon={Server} label="Guilds" value={settings.status.guildCount} />
                    <DiagItem
                        icon={Activity}
                        label="Ping"
                        value={`${Math.round(settings.status.ping)} ms`}
                    />
                    <DiagItem
                        icon={Wrench}
                        label="Ready"
                        value={
                            settings.status.readyAt
                                ? new Date(settings.status.readyAt).toLocaleString()
                                : "-"
                        }
                    />
                </div>
            </SectionCard>
        </div>
    );
}

// ==================== ANALYTICS PAGE ====================
function AnalyticsPage({ settings }) {
    const stats = useMemo(() => {
        return {
            totalUptime: Math.floor((settings.status?.uptimeMs || 0) / 1000),
            avgPing: Math.round(settings.status?.ping || 0),
            guildCount: settings.status?.guildCount || 0,
        };
    }, [settings]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Activity}
                    label="Average Latency"
                    value={`${stats.avgPing} ms`}
                    trend="+2%"
                    trendUp={false}
                />
                <StatCard
                    icon={Server}
                    label="Active Guilds"
                    value={stats.guildCount}
                    trend="+5 this week"
                    trendUp={true}
                />
                <StatCard
                    icon={Bot}
                    label="Total Uptime"
                    value={`${Math.floor(stats.totalUptime / 3600)}h`}
                    trend="99.9% reliability"
                    trendUp={true}
                />
            </div>

            <SectionCard
                title="Command Usage"
                description="Most used commands in the last 7 days"
                actions={<Tag>Top 10</Tag>}
            >
                <div className="space-y-2">
                    {[
                        { cmd: "/help", count: 1234 },
                        { cmd: "/info", count: 892 },
                        { cmd: "/userinfo", count: 654 },
                        { cmd: "/poll", count: 432 },
                        { cmd: "/translate", count: 321 },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700"
                        >
                            <span className="text-ink-100 font-medium">{item.cmd}</span>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-32 bg-ink-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-jade-500 to-ember-500"
                                        style={{ width: `${(item.count / 1234) * 100}%` }}
                                    />
                                </div>
                                <span className="text-ink-300 text-sm w-16 text-right">
                                    {item.count}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SectionCard title="User Activity" description="Active users over time">
                    <div className="h-48 flex items-end justify-between gap-2">
                        {[45, 67, 52, 89, 76, 95, 82].map((height, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-jade-500 to-ember-500 rounded-t-lg"
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-xs text-ink-400">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Event Distribution" description="Last 24 hours">
                    <div className="space-y-3">
                        <EventBar label="Messages" count={4521} max={5000} />
                        <EventBar label="Commands" count={1234} max={5000} />
                        <EventBar label="Joins" count={87} max={5000} />
                        <EventBar label="Leaves" count={43} max={5000} />
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, trend, trendUp }) {
    return (
        <div className="rounded-2xl bg-ink-900/70 border border-ink-800/70 shadow-glow p-6">
            <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-jade-500/15 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-jade-300" />
                </div>
                <span
                    className={`text-xs px-2 py-1 rounded-full ${
                        trendUp ? "bg-jade-500/15 text-jade-300" : "bg-ember-500/15 text-ember-300"
                    }`}
                >
                    {trend}
                </span>
            </div>
            <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
                <p className="text-3xl font-bold text-ink-50 mt-1">{value}</p>
            </div>
        </div>
    );
}

function EventBar({ label, count, max }) {
    const percentage = (count / max) * 100;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-ink-200">{label}</span>
                <span className="text-ink-400">{count.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-jade-500 to-ember-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ==================== MODERATION PAGE ====================
function ModerationPage({ settings, setSettings }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard
                title="Auto Moderation"
                description="Automated content filtering and user protection"
                actions={
                    <label className="flex items-center gap-2 text-sm text-ink-100">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-ink-600 bg-ink-800"
                        />
                        Enabled
                    </label>
                }
            >
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700">
                        <span className="text-ink-100">Block spam messages</span>
                        <input type="checkbox" className="h-4 w-4 rounded" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700">
                        <span className="text-ink-100">Filter explicit content</span>
                        <input type="checkbox" className="h-4 w-4 rounded" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700">
                        <span className="text-ink-100">Auto-mute on excessive caps</span>
                        <input type="checkbox" className="h-4 w-4 rounded" />
                    </label>
                    <Field label="Spam detection threshold (messages/min)">
                        <input
                            type="number"
                            min="1"
                            max="20"
                            defaultValue={5}
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                        />
                    </Field>
                </div>
            </SectionCard>

            <SectionCard title="Moderation Logs" description="Recent moderation actions">
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {[
                        { action: "Ban", user: "User#1234", mod: "Admin", reason: "Spam" },
                        {
                            action: "Mute",
                            user: "User#5678",
                            mod: "Mod1",
                            reason: "Offensive language",
                        },
                        {
                            action: "Kick",
                            user: "User#9012",
                            mod: "Admin",
                            reason: "Breaking rules",
                        },
                    ].map((log, idx) => (
                        <div
                            key={idx}
                            className="p-3 rounded-lg bg-ink-800/60 border border-ink-700 space-y-1"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-ember-300 font-semibold">{log.action}</span>
                                <span className="text-xs text-ink-400">Just now</span>
                            </div>
                            <p className="text-sm text-ink-200">
                                <span className="text-ink-400">User:</span> {log.user}
                            </p>
                            <p className="text-sm text-ink-200">
                                <span className="text-ink-400">By:</span> {log.mod}
                            </p>
                            <p className="text-xs text-ink-300">{log.reason}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Banned Words" description="Configure content filter">
                <div className="space-y-3">
                    <textarea
                        rows={5}
                        placeholder="Enter banned words (one per line)"
                        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                    />
                    <Button variant="outline" icon={Save}>
                        Update Filter
                    </Button>
                </div>
            </SectionCard>

            <SectionCard
                title="Logging Channels"
                description="Configure where mod actions are logged"
            >
                <div className="space-y-4">
                    <Field label="Moderation Log Channel">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.modLogChannelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    modLogChannelId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <Field label="Message Log Channel">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            value={settings.msgLogChannelId || ""}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    msgLogChannelId: e.target.value,
                                }))
                            }
                            placeholder="123456789012345678"
                        />
                    </Field>
                </div>
            </SectionCard>
        </div>
    );
}

// ==================== ROLES PAGE ====================
function RolesPage({ settings, setSettings }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard
                title="YouTube subscriber roles"
                description="Define tiers and role grants."
                actions={<Tag>{settings.ytSubRoleConfig?.subscriberTiers?.length || 0} tiers</Tag>}
            >
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-ink-100">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-ink-600 bg-ink-800"
                            checked={settings.ytSubRoleConfig?.isEnabled || false}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    ytSubRoleConfig: {
                                        ...prev.ytSubRoleConfig,
                                        isEnabled: e.target.checked,
                                    },
                                }))
                            }
                        />
                        Enabled
                    </label>

                    <div className="space-y-2">
                        {settings.ytSubRoleConfig?.subscriberTiers?.map((tier, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-3 gap-2 bg-ink-800/60 border border-ink-700 rounded-lg p-3"
                            >
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-md bg-ink-900 border border-ink-700 px-2 py-2 text-ink-50"
                                    value={tier.minSubscribers}
                                    onChange={(e) => {
                                        const next = [...settings.ytSubRoleConfig.subscriberTiers];
                                        next[idx] = {
                                            ...tier,
                                            minSubscribers: Number(e.target.value),
                                        };
                                        setSettings((prev) => ({
                                            ...prev,
                                            ytSubRoleConfig: {
                                                ...prev.ytSubRoleConfig,
                                                subscriberTiers: next,
                                            },
                                        }));
                                    }}
                                    placeholder="Subscribers"
                                />
                                <input
                                    className="w-full rounded-md bg-ink-900 border border-ink-700 px-2 py-2 text-ink-50"
                                    value={tier.roleId}
                                    onChange={(e) => {
                                        const next = [...settings.ytSubRoleConfig.subscriberTiers];
                                        next[idx] = { ...tier, roleId: e.target.value };
                                        setSettings((prev) => ({
                                            ...prev,
                                            ytSubRoleConfig: {
                                                ...prev.ytSubRoleConfig,
                                                subscriberTiers: next,
                                            },
                                        }));
                                    }}
                                    placeholder="Role ID"
                                />
                                <input
                                    className="w-full rounded-md bg-ink-900 border border-ink-700 px-2 py-2 text-ink-50"
                                    value={tier.tierName}
                                    onChange={(e) => {
                                        const next = [...settings.ytSubRoleConfig.subscriberTiers];
                                        next[idx] = { ...tier, tierName: e.target.value };
                                        setSettings((prev) => ({
                                            ...prev,
                                            ytSubRoleConfig: {
                                                ...prev.ytSubRoleConfig,
                                                subscriberTiers: next,
                                            },
                                        }));
                                    }}
                                    placeholder="Tier label"
                                />
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            icon={Sparkles}
                            onClick={() =>
                                setSettings((prev) => ({
                                    ...prev,
                                    ytSubRoleConfig: {
                                        ...prev.ytSubRoleConfig,
                                        subscriberTiers: [
                                            ...(prev.ytSubRoleConfig?.subscriberTiers || []),
                                            {
                                                minSubscribers: 0,
                                                roleId: "",
                                                tierName: "New tier",
                                            },
                                        ],
                                    },
                                }))
                            }
                        >
                            Add tier
                        </Button>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Auto Roles" description="Roles assigned on member join">
                <div className="space-y-3">
                    <Field label="Default Role ID">
                        <input
                            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            placeholder="123456789012345678"
                        />
                    </Field>
                    <div className="space-y-2">
                        <p className="text-xs text-ink-400">Active auto-roles:</p>
                        <div className="flex flex-wrap gap-2">
                            <Tag>Member</Tag>
                            <Tag>Verified</Tag>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Level Rewards" description="Roles granted at specific levels">
                <div className="space-y-2">
                    {[
                        { level: 5, role: "Active Member" },
                        { level: 10, role: "Regular" },
                        { level: 25, role: "Veteran" },
                    ].map((reward, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700"
                        >
                            <span className="text-ink-100">
                                Level {reward.level} → {reward.role}
                            </span>
                            <Button variant="outline" icon={ShieldCheck}>
                                Edit
                            </Button>
                        </div>
                    ))}
                    <Button variant="ghost" icon={Sparkles}>
                        Add Reward
                    </Button>
                </div>
            </SectionCard>

            <SectionCard title="Role Permissions" description="Manage role access">
                <div className="space-y-2">
                    {["Admin", "Moderator", "Member"].map((role, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-ink-800/60 border border-ink-700"
                        >
                            <span className="text-ink-100">{role}</span>
                            <div className="flex items-center gap-2">
                                <Tag>{idx === 0 ? "Full" : idx === 1 ? "Limited" : "Basic"}</Tag>
                                <Button variant="outline" icon={Settings}>
                                    Configure
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

// ==================== COMMANDS PAGE ====================
function CommandsPage({
    customCommands,
    commandDraft,
    setCommandDraft,
    commandBusy,
    addCommand,
    deleteCommand,
}) {
    return (
        <div className="grid grid-cols-1 gap-6">
            <SectionCard
                title="Create Custom Command"
                description="Build quick text responses"
                actions={<Tag>{customCommands.length} commands</Tag>}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            placeholder="name"
                            value={commandDraft.name}
                            onChange={(e) =>
                                setCommandDraft((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                            placeholder="alias (optional)"
                            value={commandDraft.alias_name}
                            onChange={(e) =>
                                setCommandDraft((prev) => ({
                                    ...prev,
                                    alias_name: e.target.value,
                                }))
                            }
                        />
                        <Button icon={Wand2} onClick={addCommand} disabled={commandBusy}>
                            Add
                        </Button>
                    </div>
                    <textarea
                        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-ink-50"
                        rows={3}
                        placeholder="message body"
                        value={commandDraft.message}
                        onChange={(e) =>
                            setCommandDraft((prev) => ({
                                ...prev,
                                message: e.target.value,
                            }))
                        }
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Command List"
                description="All custom commands"
                actions={<Tag>Manage</Tag>}
            >
                <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                    {customCommands.map((cmd) => (
                        <div
                            key={cmd.id}
                            className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800/70 px-4 py-3"
                        >
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-ink-50">/{cmd.name}</p>
                                    {cmd.alias_name && <Tag>alias: {cmd.alias_name}</Tag>}
                                </div>
                                <p className="text-xs text-ink-400 break-all">
                                    {cmd.message.slice(0, 200)}
                                    {cmd.message.length > 200 ? "..." : ""}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                icon={ShieldCheck}
                                disabled={commandBusy}
                                onClick={() => deleteCommand(cmd.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                    {!customCommands.length && (
                        <p className="text-sm text-ink-400 text-center py-8">
                            No custom commands yet. Create one above!
                        </p>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}

// ==================== LOGS PAGE ====================
function LogsPage({ selectedGuild }) {
    const [filter, setFilter] = useState("all");

    const logs = [
        { type: "command", user: "User#1234", action: "Used /help", timestamp: "2 min ago" },
        { type: "join", user: "User#5678", action: "Joined the server", timestamp: "5 min ago" },
        { type: "leave", user: "User#9012", action: "Left the server", timestamp: "10 min ago" },
        {
            type: "message",
            user: "User#3456",
            action: "Sent a message in #general",
            timestamp: "15 min ago",
        },
        { type: "command", user: "User#7890", action: "Used /poll", timestamp: "20 min ago" },
    ];

    const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                {["all", "command", "join", "leave", "message"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            filter === f
                                ? "bg-jade-500/15 text-jade-100 border border-jade-500/30"
                                : "bg-ink-800/60 text-ink-300 border border-ink-700 hover:bg-ink-700"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <SectionCard
                title="Activity Logs"
                description={`Showing ${filteredLogs.length} events`}
                actions={<Tag>Real-time</Tag>}
            >
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                    {filteredLogs.map((log, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg bg-ink-800/60 border border-ink-700"
                        >
                            <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                    log.type === "command"
                                        ? "bg-jade-500/15 text-jade-300"
                                        : log.type === "join"
                                          ? "bg-blue-500/15 text-blue-300"
                                          : log.type === "leave"
                                            ? "bg-ember-500/15 text-ember-300"
                                            : "bg-ink-700 text-ink-300"
                                }`}
                            >
                                {log.type === "command" && <Wand2 className="h-4 w-4" />}
                                {log.type === "join" && <Users className="h-4 w-4" />}
                                {log.type === "leave" && <Users className="h-4 w-4" />}
                                {log.type === "message" && <FileText className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-ink-100 font-medium">{log.user}</p>
                                <p className="text-sm text-ink-300">{log.action}</p>
                                <p className="text-xs text-ink-500 mt-1">{log.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

// ==================== HELPER COMPONENTS ====================
function DiagItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-lg bg-ink-800/70 border border-ink-700 px-3 py-2">
            <div className="h-10 w-10 rounded-lg bg-jade-500/15 flex items-center justify-center text-jade-200">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
                <p className="text-ink-50 font-semibold">{value}</p>
            </div>
        </div>
    );
}
