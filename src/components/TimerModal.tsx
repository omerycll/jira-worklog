import { Save, X } from "lucide-react";

interface TimerModalProps {
  elapsedSeconds: number;
  formatElapsedTime: (seconds: number) => string;
  timerIssueKey: string;
  setTimerIssueKey: (key: string) => void;
  timerDescription: string;
  setTimerDescription: (desc: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function TimerModal({
  elapsedSeconds,
  formatElapsedTime,
  timerIssueKey,
  setTimerIssueKey,
  timerDescription,
  setTimerDescription,
  onSave,
  onDiscard,
}: TimerModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-[400px] shadow-2xl border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="m-0 text-lg font-bold text-slate-900 dark:text-slate-100">
            Efor Kaydet
          </h3>
          <button
            onClick={onDiscard}
            className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 text-center bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-4xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-wider">
            {formatElapsedTime(elapsedSeconds)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Geçen Süre
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            Issue Key
          </label>
          <input
            type="text"
            value={timerIssueKey}
            onChange={(e) => setTimerIssueKey(e.target.value)}
            placeholder="Örn: SHL-123"
            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            Açıklama
          </label>
          <textarea
            value={timerDescription}
            onChange={(e) => setTimerDescription(e.target.value)}
            placeholder="Ne üzerinde çalıştınız?"
            rows={3}
            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-2.5 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 px-4 rounded-md border-none bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-sm shadow-blue-600/20 flex justify-center items-center gap-2 transition-all hover:shadow-md hover:shadow-blue-600/30"
          >
            <Save size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
