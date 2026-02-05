import { Play, Square, Moon, Sun, Settings, Activity } from "lucide-react";
import { JiraAccount, LanguageCode } from "../types";

interface HeaderProps {
  accounts: JiraAccount[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  elapsedSeconds: number;
  formatElapsedTime: (seconds: number) => string;
  theme: string;
  toggleTheme: () => void;
  currentPage: "dashboard" | "settings";
  setCurrentPage: (page: "dashboard" | "settings") => void;
  language: LanguageCode;
}

export function Header({
  accounts,
  activeAccountId,
  setActiveAccountId,
  isTimerRunning,
  startTimer,
  stopTimer,
  elapsedSeconds,
  formatElapsedTime,
  theme,
  toggleTheme,
  currentPage,
  setCurrentPage,
  language,
}: HeaderProps) {
  const isTr = language === "tr";
  return (
    <header className="flex justify-between items-start mb-8 flex-wrap gap-3">
      <div className="flex flex-col gap-3 min-w-[220px]">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 select-none">
          XTime
        </h2>
        <div className="flex items-center gap-2 w-fit">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${currentPage === "dashboard"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:border-blue-300"
              }`}
          >
            <Activity size={14} /> {isTr ? "Gösterge Paneli" : "Dashboard"}
          </button>
          <button
            onClick={() => setCurrentPage("settings")}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${currentPage === "settings"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:border-blue-300"
              }`}
          >
            <Settings size={14} /> {isTr ? "Ayarlar" : "Settings"}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {accounts.length > 0 && (
          <select
            value={activeAccountId}
            onChange={(e) => setActiveAccountId(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs max-w-[180px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
        )}

        {/* Timer Toggle */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all ${isTimerRunning
              ? theme === "dark"
                ? "bg-red-900/30 border-red-800"
                : "bg-red-50 border-red-200"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
            }`}
        >
          {isTimerRunning && (
            <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
              {formatElapsedTime(elapsedSeconds)}
            </span>
          )}
          <button
            onClick={isTimerRunning ? stopTimer : startTimer}
            className={`bg-transparent border-none cursor-pointer flex items-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isTimerRunning ? "text-red-500" : "text-blue-600 dark:text-blue-400"
              }`}
            title={
              isTimerRunning
                ? isTr
                  ? "Durdur"
                  : "Stop"
                : isTr
                ? "Başlat"
                : "Start"
            }
          >
            {isTimerRunning ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm cursor-pointer"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={() => setCurrentPage("settings")}
          className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
