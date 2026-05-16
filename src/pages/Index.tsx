import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const CONTACT_URL = 'https://functions.poehali.dev/6afbe884-da81-4f1e-9505-95f538adf5e4';

const ARTIST_PHOTO = 'https://cdn.poehali.dev/projects/b3189a23-8ae0-4c0f-8889-197d53d00978/bucket/40b61dca-c35a-47ac-8ed9-f33750a848c3.jpg';
const ALBUM_COVER = 'https://cdn.poehali.dev/projects/b3189a23-8ae0-4c0f-8889-197d53d00978/bucket/9051ec99-fbb5-4bb0-b52b-92d2ca708b27.jpg';

const ALBUMS = [
  {
    id: 1,
    title: 'Двое',
    year: '2026',
    cover: ALBUM_COVER,
    tracks: [
      { num: 1, title: 'Падший ангел', duration: '—', url: 'https://pixeldrain.com/api/file/6dgi21VE' as string | undefined },
      { num: 2, title: 'Сердце демона', duration: '—', url: 'https://pixeldrain.com/api/file/AUn6RizC' as string | undefined },
      { num: 3, title: "Demon's heart", duration: '—', url: 'https://pixeldrain.com/api/file/hBCb7qBT' as string | undefined },
      { num: 4, title: 'Ласточка', duration: '—', url: 'https://pixeldrain.com/api/file/NjDYQjyb' as string | undefined },
      { num: 5, title: 'Странник', duration: '—', url: 'https://pixeldrain.com/api/file/NAfXhvBh' as string | undefined },
      { num: 6, title: 'Двое', duration: '—', url: 'https://pixeldrain.com/api/file/DhBdkD4i' as string | undefined },
      { num: 7, title: 'Вместе вопреки', duration: '—', url: 'https://pixeldrain.com/api/file/MbkSxhU5' as string | undefined },
      { num: 8, title: 'Колдун', duration: '—', url: 'https://pixeldrain.com/api/file/pzZT481D' as string | undefined },
      { num: 9, title: 'Её запреты (исп. Gisher)', duration: '—', url: 'https://pixeldrain.com/api/file/TboLhGx4' as string | undefined },
      { num: 10, title: 'Запретная любовь', duration: '—', url: 'https://pixeldrain.com/api/file/Jw3zUtNk' as string | undefined },
      { num: 11, title: 'Время', duration: '—', url: 'https://pixeldrain.com/api/file/fC1Cq4f7' as string | undefined },
    ],
  },
];

type Section = 'home' | 'albums' | 'contacts';

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (key: string, url?: string) => {
    if (playingTrack === key) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => { setPlayingTrack(null); setProgress(0); setCurrentTime(0); };
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          if (audio.duration) setProgress(audio.currentTime / audio.duration);
        };
        audio.onloadedmetadata = () => setDuration(audio.duration);
      }
      setPlayingTrack(key);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
    e.stopPropagation();
    if (!audioRef.current || playingTrack !== key) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail, message: formMessage }),
      });
      if (res.ok) {
        setFormStatus('success');
        setFormName('');
        setFormEmail('');
        setFormMessage('');
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  const navigate = (section: Section) => {
    setActiveSection(section);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e8e0d0] font-body relative overflow-x-hidden">
      {/* Noise grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-5"
        style={{ background: 'linear-gradient(to bottom, #0d0d0d, transparent)' }}
      >
        <button
          onClick={() => navigate('home')}
          className="font-display text-xl tracking-widest text-gold hover:opacity-70 transition-opacity"
        >
          Д. ФЕДЯШЕВА
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-10">
          {(['home', 'albums', 'contacts'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className={`text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                activeSection === s ? 'text-gold' : 'text-[#888] hover:text-[#e8e0d0]'
              }`}
            >
              {s === 'home' ? 'Главная' : s === 'albums' ? 'Альбомы' : 'Контакты'}
            </button>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden text-[#888]" onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? 'X' : 'Menu'} size={22} />
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-[#0d0d0d]/95 flex flex-col items-center justify-center gap-10">
          {(['home', 'albums', 'contacts'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className="font-display text-4xl italic text-[#e8e0d0] hover:text-gold transition-colors"
            >
              {s === 'home' ? 'Главная' : s === 'albums' ? 'Альбомы' : 'Контакты'}
            </button>
          ))}
        </div>
      )}

      {/* ===== HOME ===== */}
      {activeSection === 'home' && (
        <main className="min-h-screen flex flex-col">
          {/* Hero */}
          <div className="relative flex-1 min-h-screen flex items-end">
            <div className="absolute inset-0">
              <img
                src={ARTIST_PHOTO}
                alt="Автор"
                className="w-full h-full object-cover object-top animate-fade-in"
                style={{ filter: 'brightness(0.45)' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, #0d0d0d 20%, rgba(13,13,13,0.2) 60%, transparent 100%)',
                }}
              />
            </div>

            <div className="relative z-10 px-6 md:px-16 pb-20 md:pb-28 max-w-3xl animate-fade-in-delay-1">
              <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4 opacity-80">
                Автор текстов
              </p>
              <h1 className="font-display text-6xl md:text-8xl font-light italic leading-none mb-6 text-[#f0e8d8]">
                Дарья
                <br />
                Федяшева
              </h1>
              <p className="text-[#aaa] text-sm md:text-base leading-relaxed max-w-md font-light">
                Я пишу песни о том, что мне хочется выразить в словах и чем хочется поделиться. Я ищу своего слушателя, в ком мои тексты найдут отклик. Идеи и тексты песен мои собственные. Музыку и вокал мне помогает создавать ИИ. Моего ИИ-исполнителя зовут <span className="text-gold">Seth Rift</span>. На этом сайте вы можете послушать мои песни и, возможно, заинтересуетесь моим творчеством.
              </p>
              <div className="flex gap-4 mt-10 flex-wrap">
                <button
                  onClick={() => navigate('albums')}
                  className="px-7 py-3 bg-gold text-[#0d0d0d] text-xs tracking-[0.2em] uppercase font-semibold hover:opacity-85 transition-opacity"
                >
                  Слушать альбомы
                </button>
                <button
                  onClick={() => navigate('contacts')}
                  className="px-7 py-3 border border-[#444] text-[#aaa] text-xs tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-all"
                >
                  Написать
                </button>
              </div>
            </div>
          </div>


        </main>
      )}

      {/* ===== ALBUMS ===== */}
      {activeSection === 'albums' && (
        <main className="pt-28 pb-24 px-6 md:px-16 max-w-5xl mx-auto">
          <div className="animate-fade-in-up">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-3">Дискография</p>
            <h2 className="font-display text-5xl md:text-6xl italic font-light text-[#f0e8d8] mb-16">
              Альбомы
            </h2>
          </div>

          <div className="space-y-6 animate-fade-in-delay-1">
            {ALBUMS.map((album) => {
              const isOpen = expandedAlbum === album.id;
              return (
                <div
                  key={album.id}
                  className="border border-[#1e1e1e] hover:border-[#333] transition-colors duration-300"
                >
                  <button
                    onClick={() => setExpandedAlbum(isOpen ? null : album.id)}
                    className="w-full flex items-center gap-6 p-5 md:p-7 text-left"
                  >
                    <div className="relative w-20 h-20 md:w-28 md:h-28 shrink-0">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          isOpen ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                        }`}
                      />
                      {isOpen && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-8 h-8 rounded-full bg-gold/90 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#0d0d0d]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[#666] text-xs tracking-widest mb-1">{album.year}</div>
                      <div className="font-display text-2xl md:text-3xl italic text-[#f0e8d8]">
                        {album.title}
                      </div>
                      <div className="text-[#555] text-xs mt-2">{album.tracks.length} треков</div>
                    </div>

                    <div
                      className={`text-[#555] transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <Icon name="ChevronDown" size={20} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#1a1a1a] px-5 md:px-7 pb-4 animate-fade-in">
                      {album.tracks.map((track) => {
                        const key = `${album.id}-${track.num}`;
                        const isPlaying = playingTrack === key;
                        return (
                          <div
                            key={key}
                            className="track-hover flex flex-col border-b border-[#141414] last:border-0 cursor-pointer group"
                            onClick={() => handleTrackClick(key, track.url)}
                          >
                            <div className="flex items-center gap-4 py-3">
                              <div className="w-6 shrink-0 text-center">
                                {isPlaying ? (
                                  <Icon name="Pause" size={14} className="text-gold" />
                                ) : (
                                  <>
                                    <span className="text-[#444] text-xs group-hover:hidden">
                                      {track.num}
                                    </span>
                                    <span className="hidden group-hover:flex justify-center">
                                      <Icon name="Play" size={13} className="text-gold" />
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className={`flex-1 text-sm ${isPlaying ? 'text-gold' : 'text-[#bbb]'}`}>
                                {track.title}
                              </div>
                              <div className="text-[#444] text-xs tabular-nums">
                                {isPlaying ? `${formatTime(currentTime)} / ${formatTime(duration)}` : track.duration}
                              </div>
                            </div>
                            {isPlaying && (
                              <div
                                className="mb-3 mx-0 h-[3px] bg-[#1e1e1e] rounded-full cursor-pointer relative"
                                onClick={(e) => handleSeek(e, key)}
                              >
                                <div
                                  className="h-full bg-gold rounded-full transition-all duration-100"
                                  style={{ width: `${progress * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vinyl decoration */}
          <div className="mt-24 flex justify-center opacity-10">
            <div className="w-40 h-40 rounded-full border-4 border-[#888] flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#888] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#888]" />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ===== CONTACTS ===== */}
      {activeSection === 'contacts' && (
        <main className="pt-28 pb-24 px-6 md:px-16 max-w-5xl mx-auto">
          <div className="animate-fade-in-up">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-3">Связаться</p>
            <h2 className="font-display text-5xl md:text-6xl italic font-light text-[#f0e8d8] mb-4">
              Контакты
            </h2>
            <p className="text-[#666] text-sm mb-16 max-w-lg">
              По вопросам концертов, коллаборации или просто чтобы поделиться тем, что тронуло.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 animate-fade-in-delay-1">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-[#666] block mb-2">
                  Ваше имя
                </label>
                <input
                  type="text"
                  placeholder="Как вас зовут?"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-gold outline-none py-3 text-sm text-[#e8e0d0] transition-colors placeholder:text-[#333]"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-[#666] block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-gold outline-none py-3 text-sm text-[#e8e0d0] transition-colors placeholder:text-[#333]"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-[#666] block mb-2">
                  Сообщение
                </label>
                <textarea
                  rows={5}
                  placeholder="Расскажите о себе или вашем предложении..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-gold outline-none py-3 text-sm text-[#e8e0d0] transition-colors resize-none placeholder:text-[#333]"
                />
              </div>

              {formStatus === 'success' && (
                <div className="flex items-center gap-3 text-gold text-sm animate-fade-in">
                  <Icon name="CheckCircle" size={16} />
                  Сообщение отправлено! Отвечу в ближайшее время.
                </div>
              )}
              {formStatus === 'error' && (
                <div className="flex items-center gap-3 text-red-400 text-sm animate-fade-in">
                  <Icon name="AlertCircle" size={16} />
                  Ошибка отправки. Попробуйте позже или напишите напрямую.
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="px-8 py-3 bg-gold text-[#0d0d0d] text-xs tracking-[0.2em] uppercase font-semibold hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formStatus === 'sending' ? (
                  <>
                    <Icon name="Loader" size={14} className="animate-spin" />
                    Отправка...
                  </>
                ) : 'Отправить'}
              </button>
            </form>

            <div className="space-y-10">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-[#666] mb-5">Соцсети</p>
                <div className="space-y-4">
                  {[
                    { icon: 'Send', label: 'Telegram', handle: '@sokolov_music' },
                    { icon: 'Music', label: 'ВКонтакте', handle: 'vk.com/sokolov' },
                    { icon: 'Headphones', label: 'Яндекс Музыка', handle: 'Александр Соколов' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 group cursor-pointer"
                    >
                      <div className="w-10 h-10 border border-[#222] flex items-center justify-center group-hover:border-gold transition-colors">
                        <Icon
                          name={item.icon as 'Send' | 'Music' | 'Headphones'}
                          size={16}
                          className="text-[#666] group-hover:text-gold transition-colors"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-[#bbb] group-hover:text-gold transition-colors">
                          {item.label}
                        </div>
                        <div className="text-xs text-[#555]">{item.handle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1e1e1e] pt-10">
                <p className="text-xs tracking-[0.2em] uppercase text-[#666] mb-4">
                  По вопросам концертов
                </p>
                <p className="text-[#aaa] text-sm">booking@sokolov-music.ru</p>
              </div>

              <div className="border-l-2 border-gold pl-5">
                <p className="font-display text-lg italic text-[#8a7d60]">
                  «Музыка начинается там, где заканчиваются слова»
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display italic text-[#444] text-sm">Дарья Федяшева</span>
        <span className="text-[#333] text-xs tracking-widest">© 2024</span>
        <div className="flex gap-6">
          {(['home', 'albums', 'contacts'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className="text-[#444] hover:text-[#888] text-xs tracking-wide transition-colors"
            >
              {s === 'home' ? 'Главная' : s === 'albums' ? 'Альбомы' : 'Контакты'}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}