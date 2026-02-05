import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import "./App.css";

// Components
import { Header } from "./components/Header";
import { TimerModal } from "./components/TimerModal";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { JiraAccount } from "./types";

function App() {
  const [activeAccountId, setActiveAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<JiraAccount[]>([]);

  const [workHours, setWorkHours] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [jiraStatus, setJiraStatus] = useState<"connected" | "mock">("mock");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("17:00");
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "settings">("dashboard");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [timerIssueKey, setTimerIssueKey] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const timerIntervalRef = useRef<number | null>(null);

  // Dashboard Data State
  const [chartData, setChartData] = useState<any[]>([]);
  const [rawWorklogs, setRawWorklogs] = useState<any[]>([]);
  const [lastJql, setLastJql] = useState("");
  const [isWorklogLoading, setIsWorklogLoading] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [weekOffset, setWeekOffset] = useState(0);

  // 1. Load data on mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    // Settings
    const notif = localStorage.getItem("notificationEnabled");
    if (notif === "true") setNotificationEnabled(true);

    const notifTime = localStorage.getItem("notificationTime");
    if (notifTime) setNotificationTime(notifTime);

    // Accounts
    const savedAccounts = localStorage.getItem("jira_accounts");
    if (savedAccounts) {
      try {
        const parsed: JiraAccount[] = JSON.parse(savedAccounts);
        setAccounts(parsed);
        if (parsed.length > 0) {
          const lastActive = localStorage.getItem("active_account_id");
          if (lastActive && parsed.find((a) => a.id === lastActive)) {
            setActiveAccountId(lastActive);
          } else {
            setActiveAccountId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to parse accounts", e);
      }
    }

    // AutoStart
    checkAutoStart();
  }, []);

  // 2. Persist active account
  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem("active_account_id", activeAccountId);
      checkWorklogs(); // Refresh data when account changes
    }
  }, [activeAccountId]);

  // 3. Timer Logic
  useEffect(() => {
    if (isTimerRunning && startTime) {
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, startTime]);

  async function checkAutoStart() {
    try {
      const enabled = await isEnabled();
      setIsAutoStartEnabled(enabled);
    } catch (err) {
      console.error("Failed to check autostart status:", err);
    }
  }

  async function toggleAutoStart() {
    try {
      if (isAutoStartEnabled) {
        await invoke("plugin:autostart|disable");
      } else {
        await enable();
      }
      const newState = !isAutoStartEnabled;
      setIsAutoStartEnabled(newState);
    } catch (err) {
      console.error("Failed to toggle autostart:", err);
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const addAccount = async (email: string, domain: string, token: string) => {
    const newId = crypto.randomUUID();
    const cleanDomain = domain.replace(/\/+$/, "");
    const newAccount: JiraAccount = { id: newId, email, domain: cleanDomain };

    let secureSaved = false;

    // 1. Save to Secure Storage (primary path)
    try {
      await invoke("save_token", {
        service: "xtime-jira",
        user: email,
        token: token,
      });
      secureSaved = true;
    } catch (err) {
      console.error("Secure storage failed, falling back to localStorage:", err);
    }

    // 2. Fallback store token locally (only if secure storage failed)
    if (!secureSaved) {
      localStorage.setItem(`jira_token_${email}`, token);
    } else {
      // clear any stale fallback
      localStorage.removeItem(`jira_token_${email}`);
    }

    // 3. Save metadata to LocalStorage
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    localStorage.setItem("jira_accounts", JSON.stringify(updated));
    setActiveAccountId(newId);
    setJiraStatus("connected");
  };

  const deleteAccount = async (id: string) => {
    const accountToRemove = accounts.find((a) => a.id === id);
    if (accountToRemove) {
      try {
        await invoke("delete_token", {
          service: "xtime-jira",
          user: accountToRemove.email,
        });
      } catch (err) {
        console.error("Failed to delete token:", err);
      }
      // also remove fallback token if exists
      localStorage.removeItem(`jira_token_${accountToRemove.email}`);
    }

    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    localStorage.setItem("jira_accounts", JSON.stringify(updated));
    if (activeAccountId === id) {
      setActiveAccountId(updated.length > 0 ? updated[0].id : "");
    }
  };

  // --- JIRA API Actions ---

  async function getSecureToken(email: string): Promise<string | null> {
    try {
      const token = await invoke<string>("get_token", {
        service: "xtime-jira",
        user: email,
      });
      return token;
    } catch (err) {
      console.error("Failed to get secure token, trying fallback:", err);
      const fallback = localStorage.getItem(`jira_token_${email}`);
      if (fallback) return fallback;
      return null;
    }
  }

  const checkWorklogs = async () => {
    if (!activeAccountId) return;
    setIsWorklogLoading(true);

    const account = accounts.find((a) => a.id === activeAccountId);
    if (!account) {
      setIsWorklogLoading(false);
      return;
    }

    const apiToken = await getSecureToken(account.email);

    if (!apiToken) {
      console.warn("No token found for this account.");
      setJiraStatus("mock");
      loadMockData();
      setIsWorklogLoading(false);
      return;
    }

    try {
      const today = new Date();
      let startD = new Date(today);
      let endD = new Date(today);

      if (viewMode === "weekly") {
        const day = startD.getDay() || 7;
        if (day !== 1) startD.setHours(-24 * (day - 1));
        startD.setDate(startD.getDate() + weekOffset * 7);
        endD = new Date(startD);
        endD.setDate(endD.getDate() + 6);
      } else {
        startD.setDate(1);
        startD.setMonth(startD.getMonth() + weekOffset);
        endD = new Date(startD);
        endD.setMonth(endD.getMonth() + 1);
        endD.setDate(0);
      }

      const formatDate = (d: Date) => d.toISOString().split("T")[0];
      const after = formatDate(startD);
      const before = formatDate(endD);

      const jql = `worklogAuthor = currentUser() AND worklogDate >= "${after}" AND worklogDate <= "${before}"`;
      setLastJql(jql);

      const cleanDomain = account.domain.replace(/\/+$/, "");
      // Atlassian deprecates /rest/api/3/search; use /rest/api/3/search/jql
      const searchUrl = `${cleanDomain}/rest/api/3/search/jql`;

      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${account.email}:${apiToken}`)}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql,
          fields: ["worklog", "summary"],
          maxResults: 100,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Jira API Error: ${response.status} ${bodyText}`);
      }

      const data: any = await response.json();

      // /search/jql returns issues directly (SearchAndReconcileResults)
      const issues = data.issues ?? [];

      const userWorklogs: any[] = [];

      for (const issue of issues) {
        const issueLogs = issue.fields.worklog?.worklogs || [];
        for (const log of issueLogs) {
          const logDate = log.started.split("T")[0];
          if (logDate >= after && logDate <= before) {
            userWorklogs.push({
              id: log.id,
              issueKey: issue.key,
              issueSummary: issue.fields.summary,
              timeSpentSeconds: log.timeSpentSeconds,
              started: log.started,
              comment: log.comment
            });
          }
        }
      }

      setJiraStatus("connected");
      calculateStats(userWorklogs);
      setRawWorklogs(userWorklogs);

    } catch (err) {
      console.error(err);
      setJiraStatus("mock");
      loadMockData();
    } finally {
      setIsWorklogLoading(false);
    }
  };

  const calculateStats = (logs: any[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayLogs = logs.filter((l) => l.started.startsWith(todayStr));
    const totalTodaySeconds = todayLogs.reduce(
      (acc, curr) => acc + curr.timeSpentSeconds,
      0
    );
    setWorkHours(totalTodaySeconds / 3600);

    // Weekly & monthly totals (takvim haftası ve ayı bazlı)
    const weekStart = new Date(today);
    const day = weekStart.getDay() || 7; // Pazartesi = 1, Pazar = 7
    if (day !== 1) {
      weekStart.setDate(weekStart.getDate() - (day - 1));
    }
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    let weekSeconds = 0;
    let monthSeconds = 0;

    logs.forEach((log) => {
      const d = new Date(log.started);
      if (d >= weekStart && d <= weekEnd) {
        weekSeconds += log.timeSpentSeconds;
      }
      if (d >= monthStart && d <= monthEnd) {
        monthSeconds += log.timeSpentSeconds;
      }
    });

    setWeeklyHours(weekSeconds / 3600);
    setMonthlyHours(monthSeconds / 3600);

    const daysMap = new Map<string, number>();

    logs.forEach((log) => {
      const d = log.started.split("T")[0];
      daysMap.set(d, (daysMap.get(d) || 0) + log.timeSpentSeconds);
    });

    const sortedDates = Array.from(daysMap.keys()).sort();

    if (sortedDates.length === 0) {
      setChartData([]);
      return;
    }

    const dataPoints = sortedDates.map(date => {
      const d = new Date(date);
      return {
        name: d.toLocaleDateString("tr-TR", { weekday: 'short', day: 'numeric' }),
        hours: parseFloat(((daysMap.get(date) || 0) / 3600).toFixed(1))
      };
    });

    setChartData(dataPoints);
  };

  const loadMockData = () => {
    setWorkHours(0);
    setChartData([
      { name: "Pzt", hours: 0 },
      { name: "Sal", hours: 0 },
      { name: "Çar", hours: 0 },
      { name: "Per", hours: 0 },
      { name: "Cum", hours: 0 },
    ]);
    setRawWorklogs([]);
  };

  // --- Timer Actions ---

  const startTimer = () => {
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setShowSaveModal(true);
  };

  const discardTimer = () => {
    setShowSaveModal(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setTimerIssueKey("");
    setTimerDescription("");
  };

  const saveTimerWorklog = async () => {
    if (!activeAccountId || !timerIssueKey) {
      alert("Lütfen bir hesap seçin ve Issue Key girin.");
      return;
    }

    const account = accounts.find((a) => a.id === activeAccountId);
    if (!account) return;

    const apiToken = await getSecureToken(account.email);
    if (!apiToken) {
      alert("API Token bulunamadı.");
      return;
    }

    setIsWorklogLoading(true);
    try {
      const cleanDomain = account.domain.replace(/\/+$/, "");
      const url = `${cleanDomain}/rest/api/3/issue/${timerIssueKey}/worklog`;

      const now = new Date();
      const startedIso = now.toISOString().replace("Z", "+0000");

      const body = {
        timeSpentSeconds: elapsedSeconds,
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: timerDescription || "XTime Log"
                }
              ]
            }
          ]
        },
        started: startedIso
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${account.email}:${apiToken}`)}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Log kaydı başarısız: " + response.status);
      }

      await invoke("send_jira_notification", {
        title: "Efor Kaydedildi",
        body: `${timerIssueKey} için ${formatElapsedTime(elapsedSeconds)} efor girildi.`,
      });

      discardTimer();
      checkWorklogs();

    } catch (err) {
      console.error(err);
      alert("Hata oluştu: " + err);
    } finally {
      setIsWorklogLoading(false);
    }
  };

  const formatElapsedTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCheckUpdates = async () => {
    try {
      setIsCheckingUpdate(true);
      const update = await checkUpdate();

      if (!update) {
        alert("Şu anda yüklü sürüm en güncel sürüm.");
        return;
      }

      const confirmInstall = confirm(
        `Yeni bir sürüm bulundu: ${update.version} (mevcut: ${update.currentVersion}).\n\nŞimdi indirip kurmak ister misin?`
      );
      if (!confirmInstall) {
        await update.close();
        return;
      }

      await update.downloadAndInstall((event) => {
        // event: { event: "Started" | "Progress" | "Finished", data?: { contentLength?, chunkLength? } }
        if (event.event === "Progress" && event.data) {
          console.log(
            "[Updater] İndirme ilerlemesi:",
            event.data.chunkLength,
            "/",
            event.data.contentLength
          );
        }
      });

      alert("Güncelleme indirildi. Uygulama yeniden başlatıldıktan sonra yeni sürüm kullanılacak.");
      await update.close();
    } catch (err) {
      console.error("[Updater] Güncelleme kontrolü hata:", err);
      alert("Güncelleme kontrolü sırasında bir hata oluştu. Detaylar için konsolu kontrol edin.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="container mx-auto p-5 max-w-5xl font-sans text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header
        accounts={accounts}
        activeAccountId={activeAccountId}
        setActiveAccountId={setActiveAccountId}
        isTimerRunning={isTimerRunning}
        startTimer={startTimer}
        stopTimer={stopTimer}
        elapsedSeconds={elapsedSeconds}
        formatElapsedTime={formatElapsedTime}
        theme={theme}
        toggleTheme={toggleTheme}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {currentPage === "dashboard" && (
        <Dashboard
          accounts={accounts}
          activeAccountId={activeAccountId}
          workHours={workHours}
          weeklyHours={weeklyHours}
          monthlyHours={monthlyHours}
          chartData={chartData}
          rawWorklogs={rawWorklogs}
          jiraStatus={jiraStatus}
          isWorklogLoading={isWorklogLoading}
          viewMode={viewMode}
          setViewMode={setViewMode}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          lastJql={lastJql}
          checkWorklogs={checkWorklogs}
          theme={theme}
        />
      )}

      {currentPage === "settings" && (
        <Settings
          accounts={accounts}
          addAccount={addAccount}
          deleteAccount={deleteAccount}
          activeAccountId={activeAccountId}
          notificationEnabled={notificationEnabled}
          setNotificationEnabled={(v) => {
            setNotificationEnabled(v);
            localStorage.setItem("notificationEnabled", String(v));
          }}
          notificationTime={notificationTime}
          setNotificationTime={(v) => {
            setNotificationTime(v);
            localStorage.setItem("notificationTime", v);
          }}
          isAutoStartEnabled={isAutoStartEnabled}
          toggleAutoStart={toggleAutoStart}
          isCheckingUpdate={isCheckingUpdate}
          onCheckUpdates={handleCheckUpdates}
        />
      )}

      {showSaveModal && (
        <TimerModal
          elapsedSeconds={elapsedSeconds}
          formatElapsedTime={formatElapsedTime}
          timerIssueKey={timerIssueKey}
          setTimerIssueKey={setTimerIssueKey}
          timerDescription={timerDescription}
          setTimerDescription={setTimerDescription}
          onSave={saveTimerWorklog}
          onDiscard={discardTimer}
        />
      )}
    </div>
  );
}

export default App;
