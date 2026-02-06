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
import { JiraAccount, JiraIssueOption, LanguageCode } from "./types";

const DEFAULT_LOG_TEMPLATES: string[] = ["Daily", "Meeting", "Code Review"];

function App() {
  const [activeAccountId, setActiveAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<JiraAccount[]>([]);
  const [currentUserAccountIdByAccountId, setCurrentUserAccountIdByAccountId] =
    useState<Record<string, string>>({});

  const [workHours, setWorkHours] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [jiraStatus, setJiraStatus] = useState<"connected" | "mock">("mock");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<LanguageCode>("tr");
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
  const [timerHoursOverride, setTimerHoursOverride] = useState<string>("");
  const timerIntervalRef = useRef<number | null>(null);

  // Dashboard Data State
  const [chartData, setChartData] = useState<any[]>([]);
  const [rawWorklogs, setRawWorklogs] = useState<any[]>([]);
  const [lastJql, setLastJql] = useState("");
  const [isWorklogLoading, setIsWorklogLoading] = useState(false);
  const [assignedIssues, setAssignedIssues] = useState<JiraIssueOption[]>([]);
  const [isAssignedIssuesLoading, setIsAssignedIssuesLoading] = useState(false);
  const reminderIntervalRef = useRef<number | null>(null);
  const [lastReminderDate, setLastReminderDate] = useState<string | null>(null);

  const [privacyMode, setPrivacyMode] = useState(false);
  const [logTemplates, setLogTemplates] = useState<string[]>([]);

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

    // Language
    const savedLanguage = localStorage.getItem("language") as LanguageCode | null;
    if (savedLanguage === "tr" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }

    // Settings
    const notif = localStorage.getItem("notificationEnabled");
    if (notif === "true") setNotificationEnabled(true);

    const notifTime = localStorage.getItem("notificationTime");
    if (notifTime) setNotificationTime(notifTime);

    const lastReminder = localStorage.getItem("worklogReminderLastDate");
    if (lastReminder) {
      setLastReminderDate(lastReminder);
    }

    // Privacy mode
    const privacy = localStorage.getItem("privacyMode");
    if (privacy === "true") {
      setPrivacyMode(true);
    }

    // Quick log templates
    const templatesStr = localStorage.getItem("log_templates");
    if (templatesStr) {
      try {
        const parsed = JSON.parse(templatesStr);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (t) => typeof t === "string" && t.trim() !== ""
          );
          setLogTemplates(
            cleaned.length > 0 ? cleaned : DEFAULT_LOG_TEMPLATES
          );
        } else {
          setLogTemplates(DEFAULT_LOG_TEMPLATES);
        }
      } catch (e) {
        console.error("Failed to parse log templates", e);
        setLogTemplates(DEFAULT_LOG_TEMPLATES);
      }
    } else {
      setLogTemplates(DEFAULT_LOG_TEMPLATES);
    }

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
      loadAssignedIssues(); // Refresh assigned issues when account changes
    }
  }, [activeAccountId]);

  // 2.b Refresh worklogs when account or view range changes
  useEffect(() => {
    if (!activeAccountId) return;
    checkWorklogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId, viewMode, weekOffset]);

  // 2.c Daily reminder for incomplete 8h
  useEffect(() => {
    // Clear any existing interval first
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }

    if (!notificationEnabled) return;

    const checkReminder = async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // Zaten bugün gönderildiyse tekrar gönderme
        const storedLast = localStorage.getItem("worklogReminderLastDate");
        const effectiveLast = storedLast ?? lastReminderDate;
        if (effectiveLast === todayStr) return;

        const [hStr, mStr] = notificationTime.split(":");
        const targetMinutes =
          parseInt(hStr || "17", 10) * 60 + parseInt(mStr || "0", 10);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (currentMinutes < targetMinutes) return;

        // Günlük tek seferlik hatırlatma (8 saat dolu olsa bile)
        await invoke("send_jira_notification", {
          title:
            language === "tr" ? "Worklog Hatırlatıcı" : "Worklog Reminder",
          body:
            language === "tr"
              ? "Günün worklog kayıtlarını gözden geçirip eksiklerini tamamlamayı unutma."
              : "Remember to review and complete today's worklog entries.",
        });

        localStorage.setItem("worklogReminderLastDate", todayStr);
        setLastReminderDate(todayStr);
      } catch (err) {
        console.error("Failed to send daily reminder:", err);
      }
    };

    // İlk kontrol
    checkReminder();
    // Sonra her dakika kontrol et
    reminderIntervalRef.current = window.setInterval(checkReminder, 60_000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationEnabled, notificationTime, workHours, language]);

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

  function addLogTemplate(template: string) {
    const value = template.trim();
    if (!value) return;
    setLogTemplates((prev) => {
      if (prev.includes(value)) return prev;
      const next = [...prev, value];
      localStorage.setItem("log_templates", JSON.stringify(next));
      return next;
    });
  }

  function deleteLogTemplate(template: string) {
    setLogTemplates((prev) => {
      const next = prev.filter((t) => t !== template);
      localStorage.setItem("log_templates", JSON.stringify(next));
      return next;
    });
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

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
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

  async function getJiraMyselfAccountId(params: {
    accountId: string;
    domain: string;
    email: string;
    apiToken: string;
  }): Promise<string | null> {
    const cached = currentUserAccountIdByAccountId[params.accountId];
    if (cached) return cached;

    try {
      const cleanDomain = params.domain.replace(/\/+$/, "");
      const url = `${cleanDomain}/rest/api/3/myself`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${params.email}:${params.apiToken}`)}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return null;
      const data: any = await res.json();
      const accountId = data?.accountId;
      if (typeof accountId !== "string" || !accountId) return null;

      setCurrentUserAccountIdByAccountId((prev) => ({
        ...prev,
        [params.accountId]: accountId,
      }));

      return accountId;
    } catch {
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
      const myselfAccountId = await getJiraMyselfAccountId({
        accountId: account.id,
        domain: account.domain,
        email: account.email,
        apiToken,
      });

      const today = new Date();
      let startD = new Date(today);
      let endD = new Date(today);

      if (viewMode === "weekly") {
        // Hafta başlangıcı: Pazartesi kabul edilir
        const weekStart = new Date(today);
        weekStart.setHours(0, 0, 0, 0);
        const day = weekStart.getDay() || 7; // Pazar=7
        if (day !== 1) {
          weekStart.setDate(weekStart.getDate() - (day - 1));
        }

        // weekOffset: 0 = bu hafta, 1 = geçen hafta, 2 = ondan önceki hafta...
        weekStart.setDate(weekStart.getDate() - weekOffset * 7);

        startD = new Date(weekStart);
        endD = new Date(weekStart);
        endD.setDate(endD.getDate() + 6);
      } else {
        // Aylık görünüm: 0 = bu ay, 1 = geçen ay...
        startD = new Date(today);
        startD.setDate(1);
        startD.setMonth(startD.getMonth() - weekOffset);
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
          // Important: Jira "worklog" field includes logs by other users too.
          // JQL filters issues by currentUser(), but the returned issue worklogs
          // can still contain other authors. Filter by /myself accountId.
          if (myselfAccountId) {
            const authorAccountId = log?.author?.accountId;
            if (authorAccountId && authorAccountId !== myselfAccountId) continue;
          }

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

  const clearCache = async () => {
    const ok = confirm(
      language === "tr"
        ? "Yumuşak cache temizliği yapılsın mı?\n\n- Worklog / issue listeleri sıfırlanır\n- Jira kullanıcı kimliği cache’i sıfırlanır\n\nHesaplar ve token’lar silinmez."
        : "Perform a soft cache clear?\n\n- Worklog / issue lists will be reset\n- Jira user identity cache will be reset\n\nAccounts and tokens will NOT be removed."
    );
    if (!ok) return;

    setCurrentUserAccountIdByAccountId({});

    // Clear in-memory dashboard data
    setWorkHours(0);
    setWeeklyHours(0);
    setMonthlyHours(0);
    setChartData([]);
    setRawWorklogs([]);
    setLastJql("");
    setAssignedIssues([]);

    // Optional: refresh data immediately (even if user is on Settings page)
    if (activeAccountId) {
      await loadAssignedIssues();
      await checkWorklogs();
    }
  };

  const hardResetData = () => {
    const ok = confirm(
      language === "tr"
        ? "Tüm uygulama verileri (local cache) temizlensin mi?\n\n- Kayıtlı hesap listesi ve aktif hesap bilgisi sıfırlanır\n- Tema, dil ve bildirim ayarları varsayılanlara döner\n- Jira token fallback kayıtları (jira_token_*) localStorage’dan silinir\n\nGüvenli depodaki (secure storage) token’lar silinmez, istersen hesapları yeniden ekleyebilirsin."
        : "Clear all application data (local cache)?\n\n- Saved account list and active account info will be reset\n- Theme, language and notification settings will be restored to defaults\n- Jira token fallback entries (jira_token_*) will be removed from localStorage\n\nTokens stored in secure storage are NOT removed; you can re-add accounts later."
    );
    if (!ok) return;

    // Remove known app keys
    const appKeys = [
      "theme",
      "language",
      "notificationEnabled",
      "notificationTime",
      "jira_accounts",
      "active_account_id",
    ];
    appKeys.forEach((key) => localStorage.removeItem(key));

    // Remove all fallback jira_token_* keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jira_token_")) {
        localStorage.removeItem(key);
      }
    }

    // Reset React state
    setAccounts([]);
    setActiveAccountId("");
    setCurrentUserAccountIdByAccountId({});
    setWorkHours(0);
    setWeeklyHours(0);
    setMonthlyHours(0);
    setChartData([]);
    setRawWorklogs([]);
    setLastJql("");
    setAssignedIssues([]);
    setNotificationEnabled(false);
    setNotificationTime("17:00");
    setTheme("light");
    setLanguage("tr");
    setJiraStatus("mock");
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
    const hours = elapsedSeconds / 3600;
    setTimerHoursOverride(hours > 0 ? hours.toFixed(2) : "0.00");
    loadAssignedIssues();
    setShowSaveModal(true);
  };

  const discardTimer = () => {
    setShowSaveModal(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setTimerIssueKey("");
    setTimerDescription("");
    setTimerHoursOverride("");
  };

  const saveTimerWorklog = async () => {
    if (!activeAccountId || !timerIssueKey) {
      alert(
        language === "tr"
          ? "Lütfen bir hesap seçin ve Issue Key girin."
          : "Please select an account and enter an Issue Key."
      );
      return;
    }

    const account = accounts.find((a) => a.id === activeAccountId);
    if (!account) return;

    const apiToken = await getSecureToken(account.email);
    if (!apiToken) {
      alert(language === "tr" ? "API Token bulunamadı." : "API token not found.");
      return;
    }

    // Timer süresini kullanmadan önce, varsa manuel saat override'ını uygula
    let timeToUseSeconds = elapsedSeconds;
    if (timerHoursOverride.trim() !== "") {
      const normalized = timerHoursOverride.replace(",", ".");
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed) && parsed > 0) {
        timeToUseSeconds = Math.round(parsed * 3600);
      }
    }

    setIsWorklogLoading(true);
    try {
      const cleanDomain = account.domain.replace(/\/+$/, "");
      const url = `${cleanDomain}/rest/api/3/issue/${timerIssueKey}/worklog`;

      const now = new Date();
      const startedIso = now.toISOString().replace("Z", "+0000");

      const body = {
        timeSpentSeconds: timeToUseSeconds,
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: timerDescription || "JiraTracker Log",
                },
              ],
            },
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
        throw new Error(
          (language === "tr" ? "Log kaydı başarısız: " : "Worklog save failed: ") +
            response.status
        );
      }

      const displayTime = formatElapsedTime(timeToUseSeconds);

      await invoke("send_jira_notification", {
        title: language === "tr" ? "Efor Kaydedildi" : "Worklog Saved",
        body:
          language === "tr"
            ? `${timerIssueKey} için ${displayTime} efor girildi.`
            : `${displayTime} logged for ${timerIssueKey}.`,
      });

      discardTimer();
      checkWorklogs();

    } catch (err) {
      console.error(err);
      alert(
        (language === "tr" ? "Hata oluştu: " : "An error occurred: ") + String(err)
      );
    } finally {
      setIsWorklogLoading(false);
    }
  };

  const loadAssignedIssues = async () => {
    if (!activeAccountId) {
      setAssignedIssues([]);
      return;
    }

    const account = accounts.find((a) => a.id === activeAccountId);
    if (!account) {
      setAssignedIssues([]);
      return;
    }

    const apiToken = await getSecureToken(account.email);
    if (!apiToken) {
      setAssignedIssues([]);
      return;
    }

    setIsAssignedIssuesLoading(true);
    try {
      const cleanDomain = account.domain.replace(/\/+$/, "");
      const searchUrl = `${cleanDomain}/rest/api/3/search/jql`;

      const jql =
        'assignee IN (currentUser()) AND status NOT IN (Done, Resolved) ' +
        'ORDER BY created DESC, lastViewed ASC';

      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${account.email}:${apiToken}`)}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql,
          fields: ["summary", "status"],
          maxResults: 100,
        }),
      });

      if (!response.ok) {
        console.error("Assigned issues fetch failed:", response.status);
        setAssignedIssues([]);
        return;
      }

      const data: any = await response.json();
      const issues = (data.issues ?? []) as any[];

      const mapped: JiraIssueOption[] = issues.map((issue) => ({
        key: issue.key,
        summary: issue.fields?.summary ?? "",
        statusName: issue.fields?.status?.name ?? "",
      }));

      setAssignedIssues(mapped);
    } catch (err) {
      console.error("Failed to load assigned issues:", err);
      setAssignedIssues([]);
    } finally {
      setIsAssignedIssuesLoading(false);
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
        alert(
          language === "tr"
            ? "Şu anda yüklü sürüm en güncel sürüm."
            : "The currently installed version is up to date."
        );
        return;
      }

      const confirmInstall = confirm(
        language === "tr"
          ? `Yeni bir sürüm bulundu: ${update.version} (mevcut: ${update.currentVersion}).\n\nŞimdi indirip kurmak ister misin?`
          : `A new version was found: ${update.version} (current: ${update.currentVersion}).\n\nDo you want to download and install it now?`
      );
      if (!confirmInstall) {
        await update.close();
        return;
      }

      await update.downloadAndInstall((event) => {
        // event: { event: "Started" | "Progress" | "Finished", data?: { contentLength?, chunkLength? } }
        if (event.event === "Progress" && event.data) {
          console.log(
            "[Updater] İndirme ilerlemesi (chunk):",
            event.data.chunkLength
          );
        }
      });

      alert(
        language === "tr"
          ? "Güncelleme indirildi. Uygulama yeniden başlatıldıktan sonra yeni sürüm kullanılacak."
          : "Update downloaded. The new version will be used after restarting the application."
      );
      await update.close();
    } catch (err) {
      console.error("[Updater] Güncelleme kontrolü hata:", err);
      alert(
        language === "tr"
          ? "Güncelleme kontrolü sırasında bir hata oluştu. Detaylar için konsolu kontrol edin."
          : "An error occurred while checking for updates. See console for details."
      );
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
        language={language}
        privacyMode={privacyMode}
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
          assignedIssues={assignedIssues}
          isAssignedIssuesLoading={isAssignedIssuesLoading}
          language={language}
          privacyMode={privacyMode}
        />
      )}

      {currentPage === "settings" && (
        <Settings
          accounts={accounts}
          addAccount={addAccount}
          deleteAccount={deleteAccount}
          activeAccountId={activeAccountId}
          clearCache={clearCache}
          hardResetData={hardResetData}
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
          language={language}
          setLanguage={changeLanguage}
          privacyMode={privacyMode}
          setPrivacyMode={(enabled) => {
            setPrivacyMode(enabled);
            localStorage.setItem("privacyMode", String(enabled));
          }}
          logTemplates={logTemplates}
          onAddLogTemplate={addLogTemplate}
          onDeleteLogTemplate={deleteLogTemplate}
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
          availableIssues={assignedIssues}
          isIssuesLoading={isAssignedIssuesLoading}
          effortHours={timerHoursOverride}
          setEffortHours={setTimerHoursOverride}
          language={language}
          logTemplates={logTemplates}
        />
      )}
    </div>
  );
}

export default App;
