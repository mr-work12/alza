import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useSpring, useReducedMotion, useMotionValueEvent, useAnimationFrame, useInView } from 'framer-motion';
import { ArrowUpRight, ArrowDown, ArrowRight, Play, X, Menu, Mail, Phone, MapPin, Instagram, Youtube, Download, Pause, Search, Plus, Minus, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import archive from './data/projects.json';
import brands from './data/brands.json';
import './styles.css';

const MotionContext = createContext(true);
const EASE = [0.22, 1, 0.36, 1];
const categories = ['Semua', 'Web App', 'Artikel', 'Desain Dakwah', 'Sertifikasi'];
const featured = ['SIMAK IMM', 'Pesan Moderasi Beragama dalam Buku Relevansi Islam Wasathiyah', 'Bersuara dengan Ilmu, Berdakwah dengan Media'].map(key => archive.find(p => p.media === key || p.title === key)).filter(Boolean);
const experiences = [
  { date: 'SEKARANG', title: 'Kabid Kader', place: 'PK IMM FAI UM Bengkulu', text: 'Mengelola kaderisasi dan pendataan kader komisariat. Merancang dan menjalankan SIMAK IMM, aplikasi absensi kegiatan berbasis GPS dan database kader, sebagai operatornya.' },
  { date: '2026', title: 'Ketua Panitia PKKMB', place: 'Fakultas Agama Islam UM Bengkulu', text: 'Memimpin PKKMB FAI Tahun Akademik 2026/2027 bertema "Menyatakan Langkah, Membuka Masa Depan" di Masjid At-Tanwir Kampus IV, diikuti 42 mahasiswa baru, sampai menyusun laporan pertanggungjawaban kegiatan dan dana.' },
  { date: 'JAN – FEB 2026', title: 'Praktik Kerja Lapangan', place: 'Rumah Singgah Al Ma\u2019un', text: 'Bertugas di Divisi Pendidikan rumah singgah binaan PWM Bengkulu: mengajar mengaji dan mendampingi anak binaan, serta ikut gotong royong.' },
  { date: '2025', title: 'KKN Mubaligh Hijrah', place: 'PCM Singaran Pati, Kota Bengkulu', text: 'Berdakwah dan mendampingi kegiatan syiar Ramadhan 1446 H bersama Pimpinan Cabang Muhammadiyah Singaran Pati, lalu menuliskannya menjadi artikel jurnal.' },
  { date: '2023 – 2025', title: 'Bidang Tabligh', place: 'KOMPAQ, Komunitas Mahasiswa Pecinta Al-Qur\u2019an', text: 'Sekretaris Bidang Tabligh (2023–2024), lalu Kepala Bidang Tabligh (2024–2025). Mengoordinasikan program syiar dan kajian komunitas.' },
  { date: '2023 – 2024', title: 'Sekretaris', place: 'Hijrah Community', text: 'Mengelola administrasi, surat-menyurat, dan dokumentasi kegiatan komunitas.' },
];
const certificates = [
  { title: 'CPHRM · CeritaKerja.id', year: '2026', image: './Asset/img/karya/cphrm.jpg', link: 'https://drive.google.com/file/d/1eBxteWRKu-5eaFESAaYJ0OXbhcdDuzDy/view' },
  { title: 'Wasit Panahan Tradisional', year: '2026', bow: true, image: './Asset/img/sertifikat/wasit.jpg', link: './Asset/img/sertifikat/wasit.jpg' },
  { title: 'Pelatih Panahan Tradisional', year: '2026', bow: true, image: './Asset/img/sertifikat/pelatih.jpg', link: './Asset/img/sertifikat/pelatih.jpg' },
  { title: 'Administrasi Perkantoran', year: '2026', image: './Asset/img/sertifikat/administrasi.jpg', link: './Asset/img/sertifikat/administrasi.jpg', note: 'Sertifikat penyelesaian kursus dari Kelas.com, 19 September 2026.' },
  { title: 'BNSP Pemasaran Digital', year: '2025', image: './Asset/img/karya/bnsp.jpg', link: 'https://drive.google.com/file/d/1z5ta_DLD0RkpbXTw0PxIKioKyxHZPreK/view' },
  { title: 'Webinar Public Speaking', year: '2026', image: './Asset/img/karya/public-speaking.jpg', link: 'https://drive.google.com/file/d/1ugQh-FVBwOY5fyxHSx9uN3Ki_dr3eY8q/view' },
  { title: 'Future Leader & Career Strategy', year: '2026', image: './Asset/img/karya/future-leader.jpg', link: 'https://drive.google.com/file/d/17a0YHRaRt0nBmuspXTbAcrok9dCEoZh2/view' },
];
const awards = [
  {year:'2026',title:'CPHRM, Predikat B (85,47)',event:'CeritaKerja.id · Batch 29'},
  {year:'2026',title:'Wasit Panahan Tradisional',event:'Panah Indonesia · Kota Bengkulu',bow:true},
  {year:'2026',title:'Pelatih Panahan Tradisional',event:'Panah Indonesia · Kota Bengkulu',bow:true},
  {year:'2026',title:'Administrasi Perkantoran',event:'Kelas.com · CERT-BC1EDC1C'},
  {year:'2025',title:'Kompeten: Pemasaran Digital',event:'BNSP · LSP Teknologi Digital'},
  {year:'2026',title:'Webinar Nasional Public Speaking',event:'Entrepreneur Training Center'},
  {year:'2026',title:'Future Leader & Career Strategy',event:'International Webinar · ETC'},
];

function BowArrow({ size = 18 }) {
  return <svg className="bow-arrow" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-0.15em', marginRight: '0.45em', color: 'var(--red)', flexShrink: 0 }}><path d="M7 2.5C2.5 7 2.5 17 7 21.5"/><path d="M7 2.5v19" strokeWidth="1"/><path d="M2.5 12h19"/><path d="M21.5 12l-3.5-2.6M21.5 12l-3.5 2.6"/><path d="M4.5 12l-2-2.2M4.5 12l-2 2.2M6.8 12l-2-2.2M6.8 12l-2 2.2" strokeWidth="1.2"/></svg>;
}

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const enabled = useContext(MotionContext);
  const Component = motion[as];
  return <Component className={className} initial={enabled ? { opacity: 0, y: 32 } : false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.12 }} transition={{ duration: enabled ? 0.75 : 0, delay, ease: EASE }}>{children}</Component>;
}

function MediaImage({ src, alt, className = '', priority = false, ...props }) {
  const [state, setState] = useState('loading');
  const imgRef = useRef(null);
  useEffect(() => {
    const img = imgRef.current;
    // Cached images can finish before React attaches onLoad.
    setState(img?.complete ? (img.naturalWidth ? 'loaded' : 'error') : 'loading');
  }, [src]);
  return <span className={`media-image ${state} ${className}`}>
    {state === 'error' && <span className="image-fallback"><span className="display">R.</span><span>Pratinjau tidak tersedia</span></span>}
    <img ref={imgRef} src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} width="960" height="600" onLoad={() => setState('loaded')} onError={e => {
      if (e.currentTarget.src.includes('maxresdefault.jpg')) e.currentTarget.src = e.currentTarget.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
      else setState('error');
    }} {...props} />
  </span>;
}

function Magnetic({ children, className = '', ...props }) {
  const enabled = useContext(MotionContext);
  const x = useSpring(0, { stiffness: 220, damping: 20 });
  const y = useSpring(0, { stiffness: 220, damping: 20 });
  return <motion.a className={className} style={{ x, y }} onPointerMove={e => {
    if (!enabled || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.12); y.set((e.clientY - r.top - r.height / 2) * 0.2);
  }} onPointerLeave={() => { x.set(0); y.set(0); }} {...props}>{children}</motion.a>;
}

function Header({ enabled, onToggle }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-15% 0px -65% 0px' });
    document.querySelectorAll('main > section[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <header className="site-header">
    <a className="wordmark" href="#home" aria-label="Alzawan, beranda">ALZAWAN<span>.</span></a>
    <nav className="desktop-nav" aria-label="Navigasi utama">{[['portfolio', 'Karya'], ['awards', 'Sertifikasi'], ['about', 'Tentang'], ['experience', 'Perjalanan'], ['contact', 'Kontak']].map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>{label}</a>)}</nav>
    <div className="header-actions"><button className="motion-toggle" onClick={onToggle} aria-label={enabled ? 'Jeda animasi' : 'Aktifkan animasi'} aria-pressed={!enabled}>{enabled ? <Pause size={13} /> : <Play size={13} />}<span>Motion {enabled ? 'on' : 'off'}</span></button><a className="header-contact" href="#contact">Let’s talk <ArrowUpRight size={16} /></a><button className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Tutup menu' : 'Buka menu'}>{open ? <X /> : <Menu />}</button></div>
    <AnimatePresence>{open && <motion.nav id="mobile-menu" className="mobile-menu" aria-label="Navigasi mobile" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>{[['home', 'Beranda'], ['portfolio', 'Karya'], ['awards', 'Sertifikasi'], ['about', 'Tentang'], ['experience', 'Perjalanan'], ['contact', 'Kontak']].map(([id, label], i) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}><span>0{i + 1}</span>{label}<ArrowUpRight size={18} /></a>)}</motion.nav>}</AnimatePresence>
  </header>;
}

function Hero({ onProject }) {
  const ref = useRef(null);
  const enabled = useContext(MotionContext);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 85]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -55]);
  return <section id="home" className="hero" ref={ref}>
    <div className="hero-top"><span>KOMUNIKASI & PENYIARAN ISLAM<br/><span className="muted">PENULIS · ORGANISATOR · KREATOR</span></span><span className="availability"><i />AVAILABLE FOR COLLABORATION</span></div>
    <motion.div className="hero-title display" aria-hidden="true" style={enabled ? { y: titleY } : {}} initial={enabled ? { clipPath: 'inset(0 0 100% 0)' } : false} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 1.4, ease: EASE }}>PORTFOLIO</motion.div>
    <motion.div className="hero-portrait" style={enabled ? { y: portraitY, scale: portraitScale } : {}} initial={enabled ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }}><img src="./Asset/img/alzawan-portrait.png" alt="M. Alzawan Saputra mengenakan blazer merah marun IMM dengan pencahayaan studio merah" width="1024" height="1536" fetchPriority="high" /></motion.div>
    <motion.div className="hero-intro" style={enabled ? { y: copyY } : {}} initial={enabled ? { opacity: 0, x: -35 } : false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.35, ease: EASE }}>
      <p className="handwriting">Hello, I’m</p><h1 className="display">ALZAWAN<span>.</span></h1><p className="hero-role">KOMUNIKATOR & <br />PENGGERAK DAKWAH</p><p className="hero-description">Bersuara dengan ilmu. Berdakwah dengan media.<br />Saya menulis, merancang konten dakwah, membangun sistem organisasi, dan menyampaikan gagasan.</p>
      <Magnetic href="#portfolio" className="primary-link">Lihat karya saya <ArrowDown size={17}/></Magnetic>
      <span className="hero-location"><MapPin size={12} /> BENGKULU, INDONESIA</span>
    </motion.div>
    <motion.div className="hero-side" initial={enabled ? { opacity: 0, x: 30 } : false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.55, ease: EASE }}>
      <div className="hero-manifesto"><span className="crosshair" aria-hidden="true">✳</span><p>Every message.<br />A meaningful purpose.</p></div>
      <div className="hero-stats"><div><span className="display">7</span><p>SEMESTER DI<br/>PRODI KPI</p></div><div><span className="display">3</span><p>ORGANISASI<br/>DAN KOMUNITAS</p></div><div className="hero-award-stat"><span className="display">4</span><a href="#awards" aria-label="Lihat sertifikasi Alzawan">SERTIFIKASI KOMPETENSI<ArrowUpRight size={12}/></a></div><a href="#experience"><ArrowDown size={16}/><span>LIHAT RIWAYAT</span></a></div>
    </motion.div>
    <div className="hero-bottom"><button className="reel-button" onClick={() => onProject(featured[0])}><span className="play-circle"><Play size={12} fill="currentColor" /></span>KARYA UNGGULAN<span className="muted">SIMAK IMM</span></button><span className="hero-scroll">SCROLL TO DISCOVER <ArrowDown size={13}/></span><span className="edition">SELECTED WORK / 2023–2026</span></div>
  </section>;
}

function ProjectCard({ project, index, onOpen }) {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const video = ['youtube', 'drive'].includes(project.type);
  return <motion.article ref={ref} className="project-card" layout initial={enabled ? { opacity: 0, y: 32 } : false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.08 }} transition={{ duration: enabled ? 0.6 : 0, delay: (index % 3) * 0.06, ease: EASE }} exit={{ opacity: 0, scale: 0.96 }}>
    <button className="project-open" onClick={() => onOpen(project)} aria-label={`Lihat ${project.title}`}><motion.div className="project-picture" style={enabled ? { y } : {}}><MediaImage src={project.image} alt={project.title}/></motion.div><span className="project-type">{project.type === 'render' ? '3D BREAKDOWN' : video ? 'FILM / VIDEO' : project.type === 'website' ? 'WEB APP' : project.category === 'Sertifikasi' ? 'SERTIFIKAT' : project.category === 'Artikel' ? 'TULISAN' : 'DESAIN'}</span><span className="project-hover">{video ? <Play fill="currentColor" size={18}/> : <ArrowUpRight size={22}/>}</span><span className="project-frame" aria-hidden="true" /></button>
    <button className="project-caption" onClick={() => onOpen(project)}><span className="project-number display">{String(index + 1).padStart(2, '0')}</span><span><h3>{project.title}</h3><span className="project-category">{project.category}{project.year ? ` / ${project.year}` : ''}</span></span><ArrowUpRight size={20}/></button>
  </motion.article>;
}

function BrandStrip() {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const loopWidth = useRef(0);
  const inView = useInView(ref);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (!ref.current || showAll) return;
    const update = () => { loopWidth.current = ref.current?.querySelector('.brand-set')?.getBoundingClientRect().width || 0; };
    const observer = new ResizeObserver(update);
    observer.observe(ref.current); update();
    return () => observer.disconnect();
  }, [showAll]);
  useAnimationFrame((time, delta) => {
    if (!enabled || paused || interacting || !inView || showAll || !ref.current || !loopWidth.current) return;
    const el = ref.current;
    el.scrollLeft += Math.min(delta, 40) * 0.038;
    if (el.scrollLeft >= loopWidth.current) el.scrollLeft -= loopWidth.current;
  });
  const move = direction => { setPaused(true); ref.current?.scrollBy({ left: direction * ref.current.clientWidth * .7, behavior: enabled ? 'smooth' : 'instant' }); };
  return <Reveal className="brand-section"><div className="brand-heading"><p>BERPROSES BERSAMA<br/><strong>THE BIGGER PICTURE.</strong></p><div><button className="brand-all" onClick={() => setShowAll(v => !v)} aria-expanded={showAll} aria-controls="brand-collection">{showAll ? 'TAMPILKAN DERET' : `LIHAT SEMUA (${brands.length})`}{showAll ? <Minus size={14}/> : <Plus size={14}/>}</button>{!showAll && <><button className="icon-button brand-pause" aria-label={paused ? 'Putar animasi logo' : 'Jeda animasi logo'} aria-pressed={paused} onClick={() => setPaused(v => !v)}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button><button className="icon-button" onClick={() => move(-1)} aria-label="Logo sebelumnya"><ChevronLeft size={17}/></button><button className="icon-button" onClick={() => move(1)} aria-label="Logo selanjutnya"><ChevronRight size={17}/></button></>}</div></div><div id="brand-collection" className={showAll ? 'brand-full-grid' : 'brand-viewport'} ref={ref} onPointerEnter={e => { if(e.pointerType==='mouse') setInteracting(true); }} onPointerLeave={() => setInteracting(false)} onPointerDown={() => setPaused(true)} onFocusCapture={() => setInteracting(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }} tabIndex={showAll ? undefined : 0} role={showAll ? 'list' : 'region'} aria-label="Institusi dan organisasi, geser untuk melihat semuanya">
      {showAll ? brands.map(b => <div className="brand-logo" key={b.file} role="listitem"><img src={`./Asset/svg/brand/${b.file}`} alt={b.name} title={b.name} width="150" height="60" loading="lazy"/><span>{b.name}</span></div>) : <div className="brand-rail">{[0,1].map(copy => <div className="brand-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>{brands.map(b => <div className="brand-logo" key={b.file}><img src={`./Asset/svg/brand/${b.file}`} alt={copy ? '' : b.name} title={b.name} width="150" height="60" loading="lazy" draggable="false"/></div>)}</div>)}</div>}
    </div></Reveal>;
}

function Portfolio({ onProject }) {
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(9);
  const results = archive.filter(p => (category === 'Semua' || p.category === category) && `${p.title} ${p.category} ${p.role}`.toLowerCase().includes(query.toLowerCase()));
  const projects = expanded || category !== 'Semua' || query ? results.slice(0, limit) : featured;
  return <section id="portfolio" className="portfolio section-wrap">
    <Reveal className="section-heading"><div><span className="eyebrow">01 / SELECTED WORK</span><h2>KARYA YANG BICARA<span className="accent">.</span></h2></div><button className="text-link" onClick={() => { if (expanded) { setExpanded(false); setCategory('Semua'); setQuery(''); } else { setExpanded(true); setLimit(9); } }}>{expanded ? 'KARYA PILIHAN' : 'SEMUA KARYA'}<ArrowRight size={21}/></button></Reveal>
    <Reveal className="portfolio-toolbar">
      <div className="filters" role="group" aria-label="Kategori karya">
        {categories.map(c => <button key={c} className={category === c ? 'selected' : ''} aria-pressed={category === c} onClick={() => { setCategory(c); setExpanded(true); setLimit(9); }}>{c}{c === category && <motion.span className="filter-line" layoutId="filter-line"/>}</button>)}
      </div>
      <label className="search-box"><Search size={15}/><span>Cari</span><input aria-label="Cari karya" type="search" placeholder="Judul atau kategori…" value={query} onChange={e => { setQuery(e.target.value); setExpanded(true); setLimit(9); }}/></label>
    </Reveal>
    <motion.div className="project-grid" layout><AnimatePresence mode="popLayout">{projects.map((p, i) => <ProjectCard key={p.category + p.title + p.media} project={p} index={i} onOpen={onProject}/>)}</AnimatePresence></motion.div>
    {projects.length === 0 && <div className="empty-state"><p>Tidak ada karya untuk “{query}”.</p><button className="text-link" onClick={() => { setQuery(''); setCategory('Semua'); }}>Reset pencarian <X size={15}/></button></div>}
    {expanded && results.length > limit && <div className="load-more"><button className="outline-button" onClick={() => setLimit(v => v + 9)}>Tampilkan karya lainnya <Plus size={16}/></button><span>{projects.length} dari {results.length} karya</span></div>}
    <BrandStrip/>
  </section>;
}

const processSteps = [
  ['01', 'MENDENGAR', 'Memahami kebutuhan, audiens, dan pesan yang ingin disampaikan sebelum menulis atau merancang apa pun.'],
  ['02', 'MENELAAH', 'Mengumpulkan rujukan, data, dan dalil. Memastikan setiap gagasan berdiri di atas sumber yang jelas.'],
  ['03', 'MERANCANG', 'Menyusun naskah, desain konten, atau alur sistem yang sesuai dengan tujuan dan cara kerja tim.'],
  ['04', 'MENYEMPURNAKAN', 'Merevisi bahasa, tampilan, dan fungsi bersama pembimbing atau pengguna sampai benar-benar siap.'],
  ['05', 'MENYAMPAIKAN', 'Mempublikasikan, mempresentasikan, dan menjalankannya, lalu terus mendengar masukan.'],
];
function Awards({onProject}) {
  const [expanded,setExpanded] = useState(false);
  const laurelPath = 'M48 94C8 68 9 30 35 5M22 61C8 60 3 49 3 44c12 0 19 6 19 17zm-5-19C5 35 6 23 8 19c11 5 13 14 9 23zm7-20C15 12 20 3 24 0c7 8 6 16 0 22zM31 79C17 79 8 70 7 64c13-2 22 4 24 15zm-3-18c-5-10-2-19 7-25 5 11 1 20-7 25zm10 24c-6-11-4-20 5-27 6 9 5 20-5 27z';
  return <section id="awards" className={`recognition section-wrap ${expanded ? 'awards-expanded' : ''}`}>
    <Reveal className="recognition-intro">
      <span className="eyebrow">RECOGNITION & AWARDS</span>
      <h2 className="display">THE WORK.<br/><span className="accent">THE RECOGNITION.</span></h2>
      <div className="award-total">
        <svg viewBox="0 0 60 100" aria-hidden="true"><path d={laurelPath} fill="currentColor"/></svg>
        <span className="display">7</span>
        <svg viewBox="0 0 60 100" aria-hidden="true"><g transform="translate(60 0) scale(-1 1)"><path d={laurelPath} fill="currentColor"/></g></svg>
        <span className="award-total-label">SERTIFIKAT</span>
      </div>
      <p>Belajar dengan sungguh-sungguh.<br/>Sertifikat yang jadi alasan untuk terus bertumbuh.</p>
      <button className="text-link award-proof" onClick={()=>onProject({...certificates[0],type:'image',category:'Sertifikat',media:certificates[0].link,description:'Sertifikat CPHRM Batch 29, CeritaKerja.id. Dokumen asli tersimpan di Google Drive.'})}>LIHAT SERTIFIKAT<ArrowUpRight size={18}/></button>
    </Reveal>
    <div className="recognition-list">
      <div className="recognition-list-head"><span>SERTIFIKASI & PELATIHAN</span><span>2025 – 2026</span></div>
      <ol id="recognition-list">{awards.map((award,i)=><Reveal as="li" className={`recognition-row ${i>2?'additional-award':''}`} key={award.title} delay={i*.045}>
        <span className="award-index">0{i+1}</span>
        <div><h3>{award.bow && <BowArrow/>}{award.title}</h3><p>{award.event}</p></div>
        <span className="award-year display">{award.year}</span>
      </Reveal>)}</ol>
      <button className="award-expand" aria-expanded={expanded} aria-controls="recognition-list" onClick={()=>setExpanded(v=>!v)}>{expanded?'Ringkas daftar':'Lihat sertifikat lainnya'}{expanded?<Minus size={16}/>:<Plus size={16}/>}</button>
    </div>
  </section>;
}
function Breakdown() {
  const scene = featured.find(p => p.type === 'render');
  const ref = useRef(null);
  const enabled = useContext(MotionContext);
  const [manual, setManual] = useState(false);
  const [cut, setCut] = useState(65);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  useMotionValueEvent(scrollYProgress, 'change', v => { if (!manual && enabled) setCut(Math.round(90 - v * 80)); });
  const titleX = useTransform(scrollYProgress, [0, 1], [30, -30]);
  if (!scene) return null;
  const resize = url => url.replace('/upload/', '/upload/c_scale,w_1200,q_auto,f_auto/');
  return <section className="breakdown section-wrap" ref={ref} aria-labelledby="breakdown-title"><Reveal className="breakdown-copy"><span className="eyebrow">A LOOK UNDER THE SURFACE</span><motion.h2 id="breakdown-title" className="display" style={enabled ? { x: titleX } : {}}>FROM RAW.<br/><span className="accent">TO REAL.</span></motion.h2><p>Satu scene. Berlapis proses.<br/>Lihat bagaimana sebuah 3D environment berubah dari bentuk dasar menjadi dunia yang hidup.</p><span className="breakdown-credit">CYBERPUNK ENVIRONMENT / 2025<br/>3D ARTIST · LIGHTING · RENDERING</span></Reveal><Reveal className="comparison"><div className="comparison-stage" style={{'--cut': `${enabled || manual ? cut : 50}%`}}><MediaImage src={resize(scene.renders[0].solid)} alt="Cyberpunk environment sebelum material dan pencahayaan"/><div className="comparison-final"><MediaImage src={resize(scene.renders[0].final)} alt="Cyberpunk environment hasil render akhir"/></div><span className="comparison-label raw-label">SOLID VIEW</span><span className="comparison-label final-label">FINAL RENDER</span><div className="comparison-divider"><span><ChevronLeft size={14}/><ChevronRight size={14}/></span></div><input aria-label="Perbandingan sebelum dan sesudah render" aria-valuetext={`${cut}% solid, ${100-cut}% final render`} type="range" min="0" max="100" value={cut} onChange={e => { setManual(true); setCut(Number(e.target.value)); }}/></div><div className="comparison-caption"><span>GESER UNTUK MELIHAT PROSESNYA</span><span>DRAG / SCROLL</span></div></Reveal></section>;
}
function About() {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 75%'] });
  return <section id="about" className="about section-wrap" ref={ref}>
    <Reveal className="about-lead"><div><span className="eyebrow">02 / BEHIND THE FRAMES</span><h2 className="display">BUKAN SEKADAR BICARA.<br/>TAPI CARA <span className="accent">MENYAMPAIKAN.</span></h2></div><p>Saya M. Alzawan Saputra, mahasiswa Komunikasi dan Penyiaran Islam di Universitas Muhammadiyah Bengkulu. Saya bergerak di antara tulisan ilmiah, konten dakwah, dan organisasi, dengan minat pada ideologi, teologi, buku, dan pengembangan kader.</p></Reveal>
    <div className="studio-grid">
      <Reveal className="education-panel"><h3 className="panel-heading">EDUCATION & SKILLS</h3><p className="eyebrow accent">PENDIDIKAN</p><div className="education-row"><strong>Universitas Muhammadiyah Bengkulu</strong><span>2023 – sekarang</span><p>S1 Komunikasi dan Penyiaran Islam, Fakultas Agama Islam.</p></div><div className="education-row"><strong>SMKN 8 Kaur</strong><span>2020 – 2023</span><p>Pendidikan menengah kejuruan.</p></div><div className="education-row"><strong>Sertifikasi & Pelatihan</strong><p>CPHRM CeritaKerja.id · BNSP Pemasaran Digital · Administrasi Perkantoran (Kelas.com) · Wasit & Pelatih Panahan Tradisional</p></div><p className="eyebrow accent skills-heading">KEAHLIAN & ALAT KERJA</p><div className="skill-tags">{['Public Speaking', 'Penulisan Ilmiah', 'Analisis Isi', 'Konten Dakwah', 'Digital Marketing', 'Manajemen SDM', 'Administrasi Organisasi', 'Web App Apps Script', 'Panahan Tradisional'].map(s => <span key={s}>{s}</span>)}</div><div className="software-row">{[['cv', 'Canva'], ['wd', 'Microsoft Word'], ['gs', 'Google Sheets'], ['as', 'Google Apps Script'], ['gh', 'GitHub'], ['nt', 'Netlify']].map(([file, name]) => <img key={file} src={`./Asset/svg/${file}.svg`} alt={name} title={name} loading="lazy" width="28" height="28"/>)}</div></Reveal>
      <div className="process-panel"><Reveal><h3 className="panel-heading">DARI GAGASAN KE DAMPAK</h3></Reveal><div className="process-list"><div className="process-track"><motion.div style={{ scaleY: enabled ? scrollYProgress : 1 }}/></div>{processSteps.map(([num, title, text], i) => <Reveal key={num} className="process-row" delay={i * 0.035}><span className="process-num display">{num}</span><span className="process-node"/><div><h4>{title}</h4><p>{text}</p></div></Reveal>)}</div></div>
      <Reveal className="quote-panel"><span className="quote-mark display">“</span><blockquote>Bersuara <br/>dengan ilmu, <br/><em>berdakwah <br/>dengan media.</em></blockquote><span className="handwriting">Alzawan</span><div className="quote-bottom">FASTABIQUL<br/>KHAIRAT.<span className="quote-symbol" aria-hidden="true">✳</span></div></Reveal>
    </div>
  </section>;
}

function Journey({ onProject }) {
  const [open, setOpen] = useState(0);
  return <section id="experience" className="journey section-wrap">
    <Reveal className="section-heading"><div><span className="eyebrow">03 / THE JOURNEY</span><h2>TERUS BERGERAK. TERUS BERKARYA<span className="accent">.</span></h2></div><a className="text-link" href="#contact">HUBUNGI SAYA<ArrowRight size={16}/></a></Reveal>
    <div className="journey-grid"><div className="experience-list">{experiences.map((job, i) => <Reveal className={`experience-row ${open === i ? 'is-open' : ''}`} key={job.title}><button aria-expanded={open === i} aria-controls={`job-${i}`} onClick={() => setOpen(open === i ? null : i)}><span className="experience-date">{job.date}</span><span><h3>{job.title}</h3><span className="experience-place">{job.place}</span></span>{open === i ? <Minus size={18}/> : <Plus size={18}/>}</button><AnimatePresence initial={false}>{open === i && <motion.div id={`job-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}><p>{job.text}</p></motion.div>}</AnimatePresence></Reveal>)}</div>
    <Reveal className="awards-panel"><p className="eyebrow">A FEW MILESTONES</p><h3 className="display">LITTLE STEPS.<br/><span className="accent">BIG MEANING.</span></h3><div className="award-list">{certificates.map((cert, i) => <button key={cert.title} onClick={() => onProject({ ...cert, type: 'image', media: cert.link || cert.image, category: 'Sertifikat', description: cert.note || (cert.bow ? 'Sertifikat dari PANAH INDONESIA Pengurus Kota Bengkulu, 22 Agustus 2026.' : 'Ringkasan sertifikat. Dokumen aslinya tersimpan di Google Drive Alzawan.') })}><span>{String(i + 1).padStart(2, '0')}</span><span>{cert.bow && <BowArrow size={16}/>}{cert.title}<small>{cert.year}</small></span><ArrowUpRight size={19}/></button>)}</div></Reveal></div>
  </section>;
}

function Contact({ onProject }) {
  const [sent, setSent] = useState(false);
  const send = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = `Assalamu’alaikum Alzawan, saya ${data.get('name')}.\n\nKeperluan: ${data.get('type')}\n${data.get('message')}`;
    const url = `https://wa.me/6282282309083?text=${encodeURIComponent(text)}`;
    setSent(url);
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
  };
  return <section id="contact" className="contact section-wrap">
    <div className="contact-grid"><Reveal className="contact-intro"><span className="eyebrow">04 / YOUR NEXT STORY</span><h2 className="display">LET’S WORK<br/>TOGETHER<span className="accent">.</span></h2><p>Punya gagasan, kegiatan, atau tulisan yang ingin diwujudkan?<br/>Mari kerjakan sesuatu yang bermanfaat.</p><Magnetic href="https://wa.me/6282282309083" target="_blank" rel="noopener noreferrer" className="contact-cta"><span className="round-arrow"><ArrowUpRight size={21}/></span>MULAI PERCAKAPAN</Magnetic></Reveal>
    <Reveal className="contact-links" delay={0.1}><a href="mailto:alzakaur123456@gmail.com"><Mail/><span><small>EMAIL</small>alzakaur123456@gmail.com</span><ArrowUpRight size={16}/></a><a href="https://simak-pk-imm-fai-um-bengkulu.netlify.app" target="_blank" rel="noopener noreferrer"><ExternalLink/><span><small>KARYA / WEB APP</small>SIMAK IMM</span><ArrowUpRight size={16}/></a><a href="tel:+6282282309083"><Phone/><span><small>PHONE / WHATSAPP</small>+62 822-8230-9083</span><ArrowUpRight size={16}/></a><div><MapPin/><span><small>BASED IN</small>Bengkulu, Indonesia</span></div></Reveal>
    <Reveal className="contact-reel" delay={0.2}><button onClick={() => onProject(featured[0])} aria-label="Buka karya unggulan SIMAK IMM"><div className="reel-screen"><span className="reel-screen-top">ALZAWAN.<span>KARYA UNGGULAN</span></span><MediaImage src="./Asset/img/karya/reel.jpg" alt="SIMAK IMM, karya unggulan Alzawan"/><span className="reel-screen-title display">BUILT TO<br/><span>SERVE.</span></span><span className="play-circle"><Play size={18} fill="currentColor"/></span></div><span className="reel-caption">BUKA KARYA. LIHAT PROSESNYA.</span></button></Reveal></div>
    <Reveal><details className="project-brief"><summary>Ceritakan keperluan Anda <Plus size={19}/></summary><form onSubmit={send}><label>Nama Anda<input name="name" required placeholder="Nama atau instansi" autoComplete="name" maxLength="100"/></label><label>Keperluan<select name="type"><option>Penulisan & artikel</option><option>Konten & desain dakwah</option><option>Pembuatan web app organisasi</option><option>Pemateri / narasumber</option><option>Kolaborasi organisasi</option><option>Lainnya</option></select></label><label className="brief-message">Detail keperluan<textarea name="message" required rows="3" placeholder="Ceritakan kegiatan, kebutuhan, dan perkiraan waktunya…" maxLength="3000"/></label><button className="solid-button" type="submit">Lanjut ke WhatsApp <ArrowUpRight size={18}/></button><p className="form-note" role="status">{sent ? <>Draft pesan sudah siap. Jika WhatsApp belum terbuka, <a href={sent} target="_blank" rel="noopener noreferrer" style={{color:'var(--red)',textDecoration:'underline'}}>buka WhatsApp di sini</a>, lalu tekan Kirim.</> : 'Brief akan dibuka sebagai draft pesan di WhatsApp.'}</p></form></details></Reveal>
  </section>;
}

function ProjectDialog({ project, onClose }) {
  const ref = useRef(null);
  const [renderMode, setRenderMode] = useState('final');
  const [shot, setShot] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [retried, setRetried] = useState(0);
  const enabled = useContext(MotionContext);
  const activeShot = project.type === 'render' ? project.renders[shot] : null;
  const embedType = activeShot?.video ? 'youtube' : activeShot?.drive ? 'drive' : project.type;
  const embedMedia = activeShot?.video || activeShot?.drive?.match(/\/d\/([^/]+)/)?.[1] || project.media;
  const isVideo = ['youtube', 'drive'].includes(embedType);
  const availableModes = [['layout', 'Layout'], ['solid', 'Solid'], ['material', 'Material'], ['lighting', 'Lighting'], ['final', 'Final render']].filter(([mode]) => activeShot?.[mode] && !(mode === 'solid' && activeShot.hideSolidMode));
  const effectiveMode = activeShot?.[renderMode] ? renderMode : availableModes[0]?.[0];
  const rendered = activeShot?.[effectiveMode] || activeShot?.image || project.image;
  const sourceUrl = embedType === 'youtube' ? `https://www.youtube.com/watch?v=${embedMedia}` : embedType === 'drive' ? `https://drive.google.com/file/d/${embedMedia}/view` : project.type === 'render' ? rendered : project.media || project.image;
  const changeShot = next => { setMediaLoaded(false); setMediaFailed(false); setShot(next); };
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const listener = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = [...ref.current.querySelectorAll('button, a[href], input, select, textarea, iframe')].filter(n => !n.disabled && n.getClientRects().length);
        const first = nodes[0]; const last = nodes.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', listener);
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', listener); previous?.focus(); };
  }, [onClose]);
  useEffect(() => {
    if (!isVideo) return;
    const timer = setTimeout(() => { if (!mediaLoaded) setMediaFailed(true); }, 14000);
    return () => clearTimeout(timer);
  }, [mediaLoaded, retried, isVideo, embedMedia]);
  return <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <motion.div ref={ref} className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex="-1" initial={enabled ? { y: 45, scale: 0.97 } : false} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      <div className="dialog-heading"><span className="eyebrow">{project.category} {project.year && ` / ${project.year}`}</span><button onClick={onClose} className="icon-button" aria-label="Tutup karya"><X/></button></div>
      <div className={`dialog-media ${!isVideo ? 'still' : ''}`}>
        {isVideo ? <>{!mediaLoaded && <div className="media-loading" role="status">{mediaFailed ? <><p>Preview belum bisa dimuat. Buka sumber aslinya untuk menonton.</p><button className="outline-button" onClick={() => { setMediaFailed(false); setMediaLoaded(false); setRetried(v => v + 1); }}>Coba lagi</button></> : <><span className={enabled ? 'loading-ring' : 'loading-ring paused'}/><p>Memuat film…</p></>}</div>}<iframe key={`${embedMedia}-${retried}`} src={embedType === 'youtube' ? `https://www.youtube-nocookie.com/embed/${embedMedia}?autoplay=1&rel=0` : `https://drive.google.com/file/d/${embedMedia}/preview`} title={project.title} width="1280" height="720" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={() => { setMediaLoaded(true); setMediaFailed(false); }} onError={() => setMediaFailed(true)}/></> : <MediaImage src={rendered} alt={project.title} priority/>}
      </div>
      {project.type === 'render' && (availableModes.length > 0 || project.renders.length > 1) && <div className="render-controls"><div role="group" aria-label="Tahap render">{availableModes.map(([mode, label]) => <button key={mode} className={effectiveMode === mode ? 'selected' : ''} onClick={() => setRenderMode(mode)} aria-pressed={effectiveMode === mode}>{label}</button>)}</div>{project.renders.length > 1 && <div className="shot-controls"><button className="icon-button" aria-label="Shot sebelumnya" onClick={() => changeShot((shot - 1 + project.renders.length) % project.renders.length)}><ChevronLeft/></button><span>SHOT {shot + 1} / {project.renders.length}</span><button className="icon-button" aria-label="Shot selanjutnya" onClick={() => changeShot((shot + 1) % project.renders.length)}><ChevronRight/></button></div>}</div>}
      <div className="dialog-description"><div><h2 id="dialog-title">{project.title}</h2>{project.role && <span className="accent">{project.role}</span>}<p>{project.description}</p></div>{sourceUrl && <a className="outline-button" href={sourceUrl} target="_blank" rel="noopener noreferrer">{project.type === 'website' ? 'Buka aplikasi' : 'Buka dokumen asli'}<ExternalLink size={15}/></a>}</div>
      {isVideo && <p className="embed-note">Jika video dibatasi oleh pemiliknya, gunakan “Buka sumber asli”.</p>}
    </motion.div>
  </motion.div>;
}

function App() {
  const reduced = useReducedMotion();
  const [motionOn, setMotionOn] = useState(() => { try { return localStorage.getItem('alzawan-motion') !== 'off'; } catch { return true; } });
  const enabled = motionOn && !reduced;
  const [project, setProject] = useState(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28, restDelta: 0.001 });
  useEffect(() => { document.documentElement.dataset.motion = enabled ? 'on' : 'off'; }, [enabled]);
  const toggle = () => { setMotionOn(!motionOn); try { localStorage.setItem('alzawan-motion', motionOn ? 'off' : 'on'); } catch {} };
  const close = React.useCallback(() => setProject(null), []);
  return <MotionContext.Provider value={enabled}>
    <MotionConfig reducedMotion={enabled ? 'user' : 'always'} transition={{ ease: EASE }}>
      <a className="skip-link" href="#portfolio">Lewati ke karya</a>
      <motion.div className="reading-progress" style={{ scaleX: enabled ? progress : scrollYProgress }}/>
      <Header enabled={enabled} onToggle={toggle}/>
      <main>
        <Hero onProject={setProject}/>
        <Portfolio onProject={setProject}/>
        <Awards onProject={setProject}/>
        <About/>
        <Journey onProject={setProject}/>
        <Contact onProject={setProject}/>
      </main>
      <footer className="footer">
        <a className="wordmark" href="#home">ALZAWAN<span>.</span></a>
        <span>© {new Date().getFullYear()} M. ALZAWAN SAPUTRA. BERSUARA DENGAN ILMU.</span>
        <div>
          <a href="mailto:alzakaur123456@gmail.com" aria-label="Email Alzawan"><Mail size={17}/></a>
          <a href="https://wa.me/6282282309083" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Alzawan"><Phone size={17}/></a>
          <a href="#home" aria-label="Kembali ke atas"><ArrowUpRight size={18}/></a>
        </div>
      </footer>
      <AnimatePresence>{project && <ProjectDialog key={project.title} project={project} onClose={close}/>}</AnimatePresence>
    </MotionConfig>
  </MotionContext.Provider>;
}

createRoot(document.getElementById('root')).render(<App/>);
