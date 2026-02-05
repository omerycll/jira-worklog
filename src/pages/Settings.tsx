import { Trash2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { JiraAccount, LanguageCode } from "../types";

interface SettingsProps {
  accounts: JiraAccount[];
  addAccount: (email: string, domain: string, token: string) => Promise<void>;
  deleteAccount: (id: string) => void;
  activeAccountId: string;
  notificationEnabled: boolean;
  setNotificationEnabled: (enabled: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
  isAutoStartEnabled: boolean;
  toggleAutoStart: () => void;
  isCheckingUpdate: boolean;
  onCheckUpdates: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export function Settings({
  accounts,
  addAccount,
  deleteAccount,
  activeAccountId,
  notificationEnabled,
  setNotificationEnabled,
  notificationTime,
  setNotificationTime,
  isAutoStartEnabled,
  toggleAutoStart,
  isCheckingUpdate,
  onCheckUpdates,
  language,
  setLanguage,
}: SettingsProps) {
  const isTr = language === "tr";
  const [formEmail, setFormEmail] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formToken, setFormToken] = useState("");

  const handleAddAccount = async () => {
    if (!formEmail || !formDomain || !formToken) return;
    await addAccount(formEmail, formDomain, formToken);
    setFormEmail("");
    setFormDomain("");
    setFormToken("");
  };

  return (
    <div className="mt-5 grid gap-6">
      {/* General Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 mt-0 mb-4 font-bold text-lg">
          {isTr ? "Genel Ayarlar" : "General Settings"}
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              {isTr ? "Dil" : "Language"}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Account Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 mt-0 mb-4 font-bold text-lg">
          {isTr ? "Yeni Hesap Ekle" : "Add New Account"}
        </h3>
        <div className="space-y-3">
          <input
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder={
              isTr ? "Email (sen@firma.com)" : "Email (you@company.com)"
            }
            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <input
            type="text"
            value={formDomain}
            onChange={(e) => setFormDomain(e.target.value)}
            placeholder={
              isTr ? "Domain (https://x.atlassian.net)" : "Domain (https://x.atlassian.net)"
            }
            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <input
            type="password"
            value={formToken}
            onChange={(e) => setFormToken(e.target.value)}
            placeholder={isTr ? "API Token" : "API Token"}
            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <button
            onClick={handleAddAccount}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md border-none cursor-pointer text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} /> {isTr ? "Ekle" : "Add"}
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 mt-0 mb-4 font-bold text-lg">
          {isTr ? "Kayıtlı Hesaplar" : "Saved Accounts"}
        </h3>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isTr ? "Henüz hesap eklenmedi." : "No accounts have been added yet."}
          </p>
        ) : (
          <div className="grid gap-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="border border-slate-200 dark:border-slate-700 p-3 rounded-md flex justify-between items-center bg-slate-50 dark:bg-slate-950/50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {acc.email}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {acc.domain}
                  </div>
                  {activeAccountId === acc.id && (
                    <span className="inline-block mt-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium border border-blue-100 dark:border-blue-800">
                      {isTr ? "Aktif" : "Active"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteAccount(acc.id)}
                  className="border-none bg-transparent text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <h3 className="mt-0 text-slate-900 dark:text-slate-100 font-bold text-lg mb-3">
          {isTr ? "Jira API Key Nasıl Alınır?" : "How to Get a Jira API Token?"}
        </h3>
        <ol className="pl-5 list-decimal space-y-2 marker:text-slate-500">
          {isTr ? (
            <>
              <li>
                Jira Cloud hesabınla giriş yap ve tarayıcıdan{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono text-xs border border-slate-200 dark:border-slate-700">
                  https://id.atlassian.com/manage-profile/security/api-tokens
                </code>{" "}
                adresine git.
              </li>
              <li>
                <strong>Create API token</strong> butonuna tıkla ve token için
                anlamlı bir isim ver (örneğin <em>XTime Desktop</em>).
              </li>
              <li>
                Oluşturulan token&apos;ı kopyala. Bu ekranı kapattıktan sonra token
                yeniden gösterilmez.
              </li>
              <li>
                Yukarıdaki <strong>Jira domain</strong> ve{" "}
                <strong>Jira API Key</strong> alanlarını doldur ve{" "}
                <strong>Ekle</strong> butonuna bas.
              </li>
              <li>
                Uygulama, Jira isteklerinde bu token&apos;ı kullanarak senin adına
                worklog verilerini okuyacak.
              </li>
            </>
          ) : (
            <>
              <li>
                Log in with your Jira Cloud account and open{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono text-xs border border-slate-200 dark:border-slate-700">
                  https://id.atlassian.com/manage-profile/security/api-tokens
                </code>{" "}
                in your browser.
              </li>
              <li>
                Click <strong>Create API token</strong> and give it a meaningful
                name (for example <em>XTime Desktop</em>).
              </li>
              <li>
                Copy the generated token. It will not be shown again after closing
                the dialog.
              </li>
              <li>
                Fill in the <strong>Jira domain</strong> and{" "}
                <strong>Jira API Key</strong> fields above and click{" "}
                <strong>Add</strong>.
              </li>
              <li>
                The app will use this token in Jira requests to read your worklog
                data.
              </li>
            </>
          )}
        </ol>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 mt-2">
        <h3 className="mt-0 text-slate-900 dark:text-slate-100 font-bold text-lg mb-4">
          {isTr ? "Bildirim Ayarları" : "Notification Settings"}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="notifToggle"
            checked={notificationEnabled}
            onChange={(e) => setNotificationEnabled(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
          />
          <label
            htmlFor="notifToggle"
            className="text-sm cursor-pointer text-slate-700 dark:text-slate-300 font-medium"
          >
            {isTr ? "Günlük Hatırlatıcı Aç" : "Enable Daily Reminder"}
          </label>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="autoStartToggle"
            checked={isAutoStartEnabled}
            onChange={toggleAutoStart}
            className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
          />
          <label
            htmlFor="autoStartToggle"
            className="text-sm cursor-pointer text-slate-700 dark:text-slate-300 font-medium"
          >
            {isTr ? "Windows ile Başlat" : "Start with Windows"}
          </label>
        </div>

        {notificationEnabled && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-200 dark:border-slate-700 w-fit">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {isTr ? "Saat:" : "Time:"}
            </span>
            <div className="flex items-center gap-1">
              <select
                value={notificationTime.split(":")[0]}
                onChange={(e) => {
                  const newHour = e.target.value;
                  const minute = notificationTime.split(":")[1] || "00";
                  setNotificationTime(`${newHour}:${minute}`);
                }}
                className="p-1 rounded border border-slate-300 dark:border-slate-600 text-sm h-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = String(i).padStart(2, "0");
                  return (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  );
                })}
              </select>
              <span className="text-slate-400 font-bold">:</span>
              <select
                value={notificationTime.split(":")[1]}
                onChange={(e) => {
                  const hour = notificationTime.split(":")[0] || "17";
                  const newMinute = e.target.value;
                  setNotificationTime(`${hour}:${newMinute}`);
                }}
                className="p-1 rounded border border-slate-300 dark:border-slate-600 text-sm h-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  // 0, 5, 10, ... 55
                  const m = String(i * 5).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  );
                })}
                {/* Fallback for odd minutes if they exist in state */}
                {!Array
                  .from({ length: 12 })
                  .map((_, i) => String(i * 5).padStart(2, "0"))
                  .includes(notificationTime.split(":")[1]) && (
                    <option value={notificationTime.split(":")[1]}>
                      {notificationTime.split(":")[1]}
                    </option>
                  )}
              </select>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
          {isTr
            ? "* Belirlenen saatte, eğer günlük 8 saati tamamlamadıysan masaüstü bildirimi gönderilir."
            : "* At the specified time, a desktop notification is sent if you have not completed 8 hours for the day."}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 mt-2">
        <h3 className="mt-0 text-slate-900 dark:text-slate-100 font-bold text-lg mb-3">
          {isTr ? "Uygulama Güncellemesi" : "Application Update"}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          {isTr
            ? "Yeni bir XTime sürümü varsa GitHub üzerinden indirip kurar. Güncelleme tamamlandıktan sonra uygulamayı yeniden başlatman gerekebilir."
            : "If a new XTime version is available, it will be downloaded and installed from GitHub. You may need to restart the app after the update finishes."}
        </p>
        <button
          onClick={onCheckUpdates}
          disabled={isCheckingUpdate}
          className={`px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${
            isCheckingUpdate
              ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-wait"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <RefreshCw
            size={16}
            className={isCheckingUpdate ? "animate-spin" : ""}
          />
          {isCheckingUpdate
            ? isTr
              ? "Güncellemeler kontrol ediliyor..."
              : "Checking for updates..."
            : isTr
            ? "Güncellemeleri Denetle"
            : "Check for Updates"}
        </button>
      </div>
    </div>
  );
}
