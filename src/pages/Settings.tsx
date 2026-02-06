import { Trash2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { JiraAccount, LanguageCode } from "../types";

interface SettingsProps {
  accounts: JiraAccount[];
  addAccount: (email: string, domain: string, token: string) => Promise<void>;
  deleteAccount: (id: string) => void;
  activeAccountId: string;
  clearCache: () => void;
  hardResetData: () => void;
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
  privacyMode: boolean;
  setPrivacyMode: (enabled: boolean) => void;
  logTemplates: string[];
  onAddLogTemplate: (template: string) => void;
  onDeleteLogTemplate: (template: string) => void;
}

export function Settings({
  accounts,
  addAccount,
  deleteAccount,
  activeAccountId,
  clearCache,
  hardResetData,
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
  privacyMode,
  setPrivacyMode,
  logTemplates,
  onAddLogTemplate,
  onDeleteLogTemplate,
}: SettingsProps) {
  const isTr = language === "tr";
  const [formEmail, setFormEmail] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formToken, setFormToken] = useState("");
  const [newTemplate, setNewTemplate] = useState("");

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
        <div className="flex flex-col gap-4">
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="privacyModeToggle"
              checked={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
            />
            <label
              htmlFor="privacyModeToggle"
              className="text-sm cursor-pointer text-slate-700 dark:text-slate-300 font-medium"
            >
              {isTr ? "Gizlilik Modu (Ekranda verileri gizle)" : "Privacy Mode (Hide data on screen)"}
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            {isTr
              ? "Açıkken email, ticket özetleri ve açıklamalar sadeleştirilmiş olarak gösterilir. Ekran paylaşırken kullanışlıdır."
              : "When enabled, emails, ticket summaries and descriptions are masked. Useful while screen sharing."}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0 italic">
            {isTr
              ? "Geliştirici modu: Uygulama penceresi odaktayken Ctrl+Shift+D (macOS: Cmd+Shift+D) ile debug konsolunu açabilirsin."
              : "Developer mode: With the app focused, press Ctrl+Shift+D (macOS: Cmd+Shift+D) to open the debug console."}
          </p>
        </div>
      </div>

      {/* Cache / Troubleshooting */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 mt-0 mb-2 font-bold text-lg">
          {isTr ? "Önbellek / Sorun Giderme" : "Cache / Troubleshooting"}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 m-0 mb-3">
          {isTr
            ? "Aşağıdaki işlemler sadece bu uygulamanın önbelleğini ve ayarlarını etkiler."
            : "Actions below only affect this application's cache and settings."}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-md border-none cursor-pointer text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 size={16} />{" "}
            {isTr ? "Yumuşak Cache Temizle" : "Soft Clear Cache"}
          </button>
          <button
            onClick={hardResetData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md border-none cursor-pointer text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 size={16} />{" "}
            {isTr ? "Tüm Veriyi Sıfırla" : "Hard Reset Data"}
          </button>
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
                    {privacyMode ? (isTr ? "Gizli Email" : "Hidden Email") : acc.email}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {privacyMode ? (isTr ? "Gizli Alan Adı" : "Hidden Domain") : acc.domain}
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

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 mt-0 mb-3 font-bold text-lg">
          {isTr ? "Hızlı Log Şablonları" : "Quick Log Templates"}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 m-0 mb-3">
          {isTr
            ? "Sık kullandığın açıklamaları kaydedip timer penceresinden tek tıkla kullanabilirsin."
            : "Save frequently used descriptions and reuse them from the timer dialog with one click."}
        </p>

        {logTemplates.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isTr
              ? "Henüz şablon eklenmemiş. Aşağıdan yeni bir şablon oluşturabilirsin."
              : "No templates added yet. Create a new template below."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {logTemplates.map((tpl) => (
              <span
                key={tpl}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
              >
                <span className="max-w-[220px] truncate">{tpl}</span>
                <button
                  type="button"
                  onClick={() => onDeleteLogTemplate(tpl)}
                  className="border-none bg-transparent text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={isTr ? "Şablonu sil" : "Delete template"}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <input
            type="text"
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
            placeholder={
              isTr
                ? "Örn: Daily, Standup, Code Review..."
                : "e.g. Daily, Standup, Code Review..."
            }
            className="flex-1 p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => {
              const value = newTemplate.trim();
              if (!value) return;
              onAddLogTemplate(value);
              setNewTemplate("");
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md border-none cursor-pointer text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} /> {isTr ? "Şablon Ekle" : "Add Template"}
          </button>
        </div>
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
                anlamlı bir isim ver (örneğin <em>JiraTracker Desktop</em>).
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
                name (for example <em>JiraTracker Desktop</em>).
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
            ? "Yeni bir JiraTracker sürümü varsa GitHub üzerinden indirip kurar. Güncelleme tamamlandıktan sonra uygulamayı yeniden başlatman gerekebilir."
            : "If a new JiraTracker version is available, it will be downloaded and installed from GitHub. You may need to restart the app after the update finishes."}
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
