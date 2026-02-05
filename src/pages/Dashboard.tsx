import {
  Activity,
  Bell,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { JiraAccount, JiraIssueOption } from "../types";
import { open } from "@tauri-apps/plugin-shell";

interface DashboardProps {
  accounts: JiraAccount[];
  activeAccountId: string;
  workHours: number;
  weeklyHours: number;
  monthlyHours: number;
  chartData: any[];
  rawWorklogs: any[];
  jiraStatus: string;
  isWorklogLoading: boolean;
  viewMode: "weekly" | "monthly";
  setViewMode: (mode: "weekly" | "monthly") => void;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  lastJql: string;
  checkWorklogs: () => void;
  theme: string;
  assignedIssues: JiraIssueOption[];
  isAssignedIssuesLoading: boolean;
}

export function Dashboard({
  accounts,
  activeAccountId,
  workHours,
  weeklyHours,
  monthlyHours,
  chartData,
  rawWorklogs,
  jiraStatus,
  isWorklogLoading,
  viewMode,
  setViewMode,
  weekOffset,
  setWeekOffset,
  lastJql,
  checkWorklogs,
  theme,
  assignedIssues,
  isAssignedIssuesLoading,
}: DashboardProps) {
  return (
    <>
      {accounts.length === 0 && (
        <div className="mt-4 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
          <span className="font-bold">Hesap bulunamadı.</span> Lütfen ayarlardan
          bir Jira hesabı ekleyin.
        </div>
      )}

      <div className="flex flex-col gap-6 mt-2">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 uppercase">
              <Activity size={14} />
              <span>BUGÜNLÜK EFOR</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
              {workHours.toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / 8.0sa
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${workHours >= 8 ? "bg-green-500" : "bg-blue-600"
                  }`}
                style={{
                  width: `${Math.min((workHours / 8) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 uppercase">
              <Activity size={14} />
              <span>BU HAFTALIK EFOR</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
              {weeklyHours.toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / 40.0sa
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${weeklyHours >= 40 ? "bg-green-500" : "bg-blue-600"
                  }`}
                style={{
                  width: `${Math.min((weeklyHours / 40) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 uppercase">
              <Activity size={14} />
              <span>BU AYLIK EFOR</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
              {monthlyHours.toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                {/* ortalama 22 iş günü * 8 saat */}
                / 176.0sa
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${monthlyHours >= 176 ? "bg-green-500" : "bg-blue-600"
                  }`}
                style={{
                  width: `${Math.min((monthlyHours / 176) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Reports Pie Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px]">
            <h3 className="mt-0 mb-6 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Proje Dağılımı
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(() => {
                    const projectMap: Record<string, number> = {};
                    rawWorklogs.forEach((log) => {
                      const projectKey = log.issueKey.split("-")[0];
                      projectMap[projectKey] =
                        (projectMap[projectKey] || 0) + log.timeSpentSeconds;
                    });
                    return Object.entries(projectMap).map(([name, seconds]) => ({
                      name,
                      value: parseFloat((seconds / 3600).toFixed(2)),
                    }));
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[0, 1, 2, 3, 4].map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"][
                        index % 5
                        ]
                      }
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border:
                      theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    color: theme === "dark" ? "#f8fafc" : "#0f172a",
                  }}
                  itemStyle={{
                    color: theme === "dark" ? "#cbd5e1" : "#475569",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-slate-600 dark:text-slate-400 text-xs ml-1">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Charts */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="m-0 text-slate-900 dark:text-slate-100 font-bold text-lg">
                İstatistikler
              </h3>
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                <button
                  onClick={() => {
                    setViewMode("weekly");
                    setWeekOffset(0);
                  }}
                  className={`px-3 py-1 rounded-[4px] cursor-pointer text-xs font-medium border-none transition-all ${viewMode === "weekly"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Haftalık
                </button>
                <button
                  onClick={() => {
                    setViewMode("monthly");
                    setWeekOffset(0);
                  }}
                  className={`px-3 py-1 rounded-[4px] cursor-pointer text-xs font-medium border-none transition-all ${viewMode === "monthly"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Aylık
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                &lt; Önceki {viewMode === "weekly" ? "Hafta" : "Ay"}
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer border border-transparent transition-colors ${weekOffset === 0
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  }`}
              >
                Bu {viewMode === "weekly" ? "Hafta" : "Ay"}
              </button>
              <button
                onClick={() => weekOffset > 0 && setWeekOffset(weekOffset - 1)}
                disabled={weekOffset === 0}
                className={`px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${weekOffset === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                Sonraki {viewMode === "weekly" ? "Hafta" : "Ay"} &gt;
              </button>
            </div>

            <div className="w-full h-[300px] relative">
              {isWorklogLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex justify-center items-center z-10 backdrop-blur-sm rounded-lg">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              )}
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    interval={viewMode === "monthly" ? 2 : 0}
                    stroke={theme === "dark" ? "#94a3b8" : "#64748b"}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke={theme === "dark" ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{
                      fill: theme === "dark" ? "#334155" : "#f1f5f9",
                      opacity: 0.4,
                    }}
                    contentStyle={{
                      borderRadius: "8px",
                      border:
                        theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
                      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                      color: theme === "dark" ? "#f8fafc" : "#0f172a",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{
                      color: theme === "dark" ? "#cbd5e1" : "#475569",
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hours >= 8 ? "#10b981" : "#2563eb"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity size={12} />
              {jiraStatus === "connected" && (
                <>
                  Veri kaynağı:{" "}
                  <strong className="text-green-600 dark:text-green-400">
                    Jira (Bağlı)
                  </strong>
                </>
              )}
              {jiraStatus !== "connected" && (
                <>
                  Veri kaynağı:{" "}
                  <strong className="text-yellow-600 dark:text-yellow-500">
                    Mock (Örnek)
                  </strong>{" "}
                  • Jira entegrasyonu tamamlandığında gerçek veriler
                  gösterilecek.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={checkWorklogs}
            disabled={!activeAccountId}
            className={`p-3 w-full rounded-md border-none flex items-center justify-center gap-2 font-medium transition-colors ${activeAccountId
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
          >
            <Bell size={18} /> Manuel Kontrol Et
          </button>
        </div>

        <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-sm uppercase tracking-wider">
              Üzerimdeki Ticket&apos;lar
            </h3>
            {isAssignedIssuesLoading && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" /> Yükleniyor...
              </span>
            )}
          </div>
          {assignedIssues.length === 0 && !isAssignedIssuesLoading && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Üzerinde açık ticket bulunmuyor.
            </p>
          )}
          {assignedIssues.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[55%]">
                      Issue
                    </th>
                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[45%]">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignedIssues.map((issue) => (
                    <tr
                      key={issue.key}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-2 align-top">
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            const domain =
                              accounts
                                .find((a) => a.id === activeAccountId)
                                ?.domain.replace(/\/+$/, "") || "";
                            if (domain) {
                              await open(`${domain}/browse/${issue.key}`);
                            }
                          }}
                          className="text-blue-600 dark:text-blue-400 font-medium no-underline hover:underline cursor-pointer"
                        >
                          {issue.key}
                        </a>
                        {issue.summary && (
                          <div
                            className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis"
                            title={issue.summary}
                          >
                            {issue.summary}
                          </div>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {issue.statusName || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {lastJql && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-md text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono">
            <div className="font-bold mb-2 text-slate-900 dark:text-slate-100">
              Debug Info (JQL):
            </div>
            <code className="block mb-2 break-all bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
              {lastJql}
            </code>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 font-sans">
              Bu sorguyu Jira'da "Advanced Issue Search" ekranına yapıştırarak
              verileri kontrol edebilirsin.
            </div>
          </div>
        )}

        {rawWorklogs.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-900 dark:text-slate-100 mb-4 font-bold text-sm uppercase tracking-wider">
              Detaylı Veri ({rawWorklogs.length} Kayıt)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[45%]">
                      Issue
                    </th>
                    <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[25%]">
                      Tarih
                    </th>
                    <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[15%] text-right">
                      Süre (Saat)
                    </th>
                    <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs w-[15%]">
                      Açıklama
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rawWorklogs.map((log: any) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 align-top">
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            const domain =
                              accounts
                                .find((a) => a.id === activeAccountId)
                                ?.domain.replace(/\/+$/, "") || "";
                            if (domain) {
                              await open(`${domain}/browse/${log.issueKey}`);
                            }
                          }}
                          className="text-blue-600 dark:text-blue-400 font-medium no-underline hover:underline cursor-pointer"
                        >
                          {log.issueKey || "-"}
                        </a>
                        <div
                          className="text-xs text-slate-500 dark:text-slate-400 max-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis"
                          title={log.issueSummary}
                        >
                          {log.issueSummary}
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                        {(() => {
                          const d = new Date(log.started);
                          const dateStr = d.toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                          });
                          const timeStr =
                            String(d.getHours()).padStart(2, "0") +
                            ":" +
                            String(d.getMinutes()).padStart(2, "0");
                          return (
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {dateStr} {timeStr}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100 text-right align-top">
                        {(log.timeSpentSeconds / 3600).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis text-xs align-top">
                        {/* @ts-ignore */}
                        {log.comment?.content?.[0]?.content?.[0]?.text ||
                          log.comment?.text ||
                          "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
