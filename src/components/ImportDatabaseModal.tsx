import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database, 
  RefreshCw, 
  FileUp, 
  Code, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Channel } from '../types';

interface ImportDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newChannels: Channel[], count: number, mode: 'replace' | 'append') => void;
}

export const ImportDatabaseModal: React.FC<ImportDatabaseModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'file' | 'paste' | 'preset'>('file');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper: parse CSV to array of objects
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      
      headers.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx] : null;
      });
      
      results.push(obj);
    }

    return results;
  };

  // Helper: parse input string (JSON or CSV)
  const processRawString = (text: string) => {
    setStatusMsg(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setPreviewData(null);
      return;
    }

    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (parsed.channels || parsed.data || parsed.items || []);
        if (list.length === 0) {
          setStatusMsg({ type: 'error', text: 'JSON валиден, но массив каналов пуст.' });
          setPreviewData(null);
        } else {
          setPreviewData(list);
          setStatusMsg({ type: 'info', text: `Распознано записей в JSON: ${list.length.toLocaleString('ru-RU')}` });
        }
      } else {
        const list = parseCSV(trimmed);
        if (list.length === 0) {
          setStatusMsg({ type: 'error', text: 'Не удалось извлечь строки из CSV. Проверьте разделитель.' });
          setPreviewData(null);
        } else {
          setPreviewData(list);
          setStatusMsg({ type: 'info', text: `Распознано строк в CSV: ${list.length.toLocaleString('ru-RU')}` });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Синтаксическая ошибка: ' + err.message });
      setPreviewData(null);
    }
  };

  // File drop/selection handler
  const handleFile = (file: File) => {
    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: `Чтение файла: ${file.name} (${(file.size / 1024).toFixed(1)} КБ)...` });

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processRawString(content);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setStatusMsg({ type: 'error', text: 'Не удалось прочитать файл.' });
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Send to backend
  const handleExecuteImport = async () => {
    if (!previewData || previewData.length === 0) return;

    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: 'Синхронизация с базой данных платформы...' });

    try {
      const res = await fetch('/api/v1/admin/import-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: previewData,
          mode: importMode
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setStatusMsg({
          type: 'success',
          text: `Успешно загружено! Добавлено: ${data.imported_count}, Всего в базе: ${data.total_count} каналов.`
        });
        onImportSuccess(data.channels, data.imported_count, importMode);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Ошибка сервера при импорте' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Сетевая ошибка: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to default seed
  const handleResetToSeed = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/admin/reset-seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'База сброшена к исходным эталонным 20 каналам!' });
        onImportSuccess(data.channels, data.total_count, 'replace');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Импорт и загрузка базы каналов</h3>
              <p className="text-xs text-slate-400">
                Загрузите ваш файл базы данных (.JSON, .CSV, выгрузку парсера) в систему
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 pt-4 pb-3">
          <button
            onClick={() => setActiveSubTab('file')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'file'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Загрузить файл (.json / .csv)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('paste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'paste'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Вставить текст (JSON / CSV)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('preset')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'preset'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Готовые базы &amp; Сброс</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* TAB 1: FILE DROPZONE */}
          {activeSubTab === 'file' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.csv,.tsv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
                }`}
              >
                <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-bounce" />
                <div className="text-white font-bold text-sm">
                  Перетащите сюда файл базы или нажмите для выбора
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Поддерживаются форматы: <span className="text-slate-300 font-mono">.JSON</span> (массив каналов), <span className="text-slate-300 font-mono">.CSV</span>, <span className="text-slate-300 font-mono">.TSV</span>
                </div>
                <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors">
                  Выбрать файл на компьютере
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeSubTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">
                Вставьте данные массива JSON или CSV:
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  processRawString(e.target.value);
                }}
                placeholder={`[
  {
    "dzen_id": "my_channel",
    "name": "Название канала",
    "niche": "IT и гаджеты",
    "subscribers": 50000,
    "views_30d": 350000,
    "er_percent": 3.8,
    "avg_viral_index": 2.1,
    "telegram": "@my_channel_tg"
  }
]`}
                className="w-full h-44 bg-slate-950 border border-slate-700 rounded-2xl p-3 font-mono text-[11px] text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* TAB 3: PRESETS & RESET */}
          {activeSubTab === 'preset' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-bold">Демонстрационная база (20 проверенных каналов)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Сбалансированный срез топ-авторов из 10 ключевых ниш с полными ставками, статьями и историей.
                  </div>
                </div>
                <button
                  onClick={handleResetToSeed}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold whitespace-nowrap"
                >
                  Сбросить к демо
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Поля, которые система распознает автоматически:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><code className="text-indigo-300">dzen_id</code> / <code className="text-indigo-300">channel_id</code> / <code className="text-indigo-300">handle</code> / <code className="text-indigo-300">url</code></li>
                  <li><code className="text-indigo-300">name</code> / <code className="text-indigo-300">title</code> (название канала)</li>
                  <li><code className="text-indigo-300">subscribers</code> / <code className="text-indigo-300">followers</code> / <code className="text-indigo-300">subs</code></li>
                  <li><code className="text-indigo-300">views_30d</code> / <code className="text-indigo-300">views</code> (охват за 30 дней)</li>
                  <li><code className="text-indigo-300">er_percent</code> / <code className="text-indigo-300">er</code> (% вовлеченности)</li>
                  <li><code className="text-indigo-300">avg_viral_index</code> / <code className="text-indigo-300">viral_index</code> / <code className="text-indigo-300">vi</code></li>
                  <li><code className="text-indigo-300">niche</code> / <code className="text-indigo-300">category</code> (тематика)</li>
                  <li><code className="text-indigo-300">telegram</code> / <code className="text-indigo-300">email</code> (контакты для сделок)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : statusMsg.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {previewData && previewData.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  Предпросмотр ({Math.min(previewData.length, 3)} из {previewData.length} каналов):
                </span>
                <span className="text-indigo-400 font-semibold">Готово к импорту</span>
              </div>

              <div className="space-y-2">
                {previewData.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {item.name || item.title || item.dzen_id || `Канал #${idx + 1}`}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        {item.niche || item.category || 'Общее'} • @{item.dzen_id || item.channel_id || 'id'}
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-slate-300 font-mono">
                      <div>{(item.subscribers || item.subscribers_count || 0).toLocaleString('ru-RU')} подп.</div>
                      <div className="text-[10px] text-amber-300">VI: {item.avg_viral_index || item.viral_index || item.vi || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Mode Selector */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
                <span className="text-slate-400">Режим загрузки:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      importMode === 'replace'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Заменить текущую базу
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      importMode === 'append'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Дополнить к существующей
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>

          {previewData && previewData.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Upload className="w-4 h-4" />
              <span>
                {isProcessing ? 'Загрузка...' : `Импортировать ${previewData.length} каналов в базу`}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
