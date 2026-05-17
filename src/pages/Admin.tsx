import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

const UPLOAD_URL = 'https://functions.poehali.dev/8dc59a66-845c-4326-8dc3-8cc45ec28a06';

const TRACK_NAMES = [
  'Падший ангел',
  'Сердце демона',
  "Demon's heart",
  'Ласточка',
  'Странник',
  'Двое',
  'Вместе вопреки',
  'Колдун',
  'Её запреты (исп. Gisher)',
  'Запретная любовь',
  'Время',
];

interface UploadResult {
  trackName: string;
  url: string;
}

export default function Admin() {
  const [uploads, setUploads] = useState<Record<string, { status: 'idle' | 'uploading' | 'done' | 'error'; url?: string; error?: string }>>({});
  const [results, setResults] = useState<UploadResult[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = (trackName: string, file: File) => {
    setUploads(prev => ({ ...prev, [trackName]: { status: 'uploading' } }));

    const filename = encodeURIComponent(`${trackName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_')}.mp3`);
    const url_with_name = `${UPLOAD_URL}?filename=${filename}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url_with_name, true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.onload = () => {
      if (xhr.status === 200) {
        const { url } = JSON.parse(xhr.responseText);
        setUploads(prev => ({ ...prev, [trackName]: { status: 'done', url } }));
        setResults(prev => {
          const filtered = prev.filter(r => r.trackName !== trackName);
          return [...filtered, { trackName, url }];
        });
      } else {
        const msg = (() => { try { return JSON.parse(xhr.responseText).error; } catch { return `HTTP ${xhr.status}`; } })();
        setUploads(prev => ({ ...prev, [trackName]: { status: 'error', error: msg } }));
      }
    };

    xhr.onerror = () => {
      setUploads(prev => ({ ...prev, [trackName]: { status: 'error', error: 'Ошибка сети' } }));
    };

    xhr.send(file);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e8e0d0] p-6 md:p-12">
      <h1 className="font-display text-3xl italic mb-2 text-gold">Загрузка треков</h1>
      <p className="text-sm text-[#888] mb-8">Загрузите mp3-файлы для каждого трека альбома «Двое»</p>

      <div className="space-y-3 max-w-2xl">
        {TRACK_NAMES.map((name, i) => {
          const state = uploads[name];
          return (
            <div key={name} className="flex items-center gap-4 bg-[#1a1a1a] rounded-lg px-4 py-3">
              <span className="text-[#555] text-sm w-6 text-right">{i + 1}</span>
              <span className="flex-1 text-sm">{name}</span>

              {state?.status === 'done' && (
                <span className="text-green-500 text-xs flex items-center gap-1">
                  <Icon name="CheckCircle" size={14} /> Загружено
                </span>
              )}
              {state?.status === 'uploading' && (
                <span className="text-yellow-500 text-xs flex items-center gap-1">
                  <Icon name="Loader" size={14} /> Загрузка...
                </span>
              )}
              {state?.status === 'error' && (
                <span className="text-red-500 text-xs flex items-center gap-1 max-w-[200px] truncate" title={state.error}>
                  <Icon name="AlertCircle" size={14} /> {state.error}
                </span>
              )}

              <input
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                className="hidden"
                ref={el => { inputRefs.current[name] = el; }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(name, file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => inputRefs.current[name]?.click()}
                disabled={state?.status === 'uploading'}
                className="shrink-0 text-xs px-3 py-1.5 border border-gold/40 text-gold rounded hover:bg-gold/10 transition-colors disabled:opacity-40"
              >
                {state?.status === 'done' ? 'Заменить' : 'Выбрать файл'}
              </button>
            </div>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm tracking-widest uppercase text-[#888] mb-4">Готовые URL ({results.length} из {TRACK_NAMES.length})</h2>
          <div className="bg-[#111] rounded-lg p-4 text-xs font-mono text-[#aaa] overflow-x-auto whitespace-pre">
            {results.map(r => `"${r.trackName}": "${r.url}"`).join('\n')}
          </div>
          <p className="text-xs text-[#555] mt-2">Напишите «обнови треки в плеере» — и я всё сделаю автоматически</p>
        </div>
      )}
    </div>
  );
}