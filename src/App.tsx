import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { Heart, Home, Compass, MessageCircle, Bell, Plus, Search, Sparkles, LogOut, Image as ImageIcon, UserRound, Menu } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type Post = { id: string; content?: string; body?: string; caption?: string; created_at?: string; user_id?: string; [key: string]: unknown };
const navItems = [{ label: 'Pulse', icon: Home }, { label: 'Discover', icon: Compass }, { label: 'Chat', icon: MessageCircle }, { label: 'Notifications', icon: Bell }, { label: 'My Space', icon: UserRound }];

function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return; setBusy(true); setError('');
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { username } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setError(result.error.message);
    else if (mode === 'signup' && !result.data.session) setError('Check your email to confirm your account, then sign in.');
  };
  return <main className="auth-shell"><div className="auth-glow" /><section className="auth-card"><div className="brand-mark">L<span>♥</span></div><p className="eyebrow">YOUR PEOPLE. YOUR MOMENTS.</p><h1>Feel closer.<br/><em>Be yourself.</em></h1><p className="muted">A new space for real connections and the moments that matter.</p><div className="tabs"><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button></div><form onSubmit={submit}>{mode === 'signup' && <label>Username<input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" minLength={3} required /></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>{error && <p className="error">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create your account' : 'Sign in'} <span>→</span></button></form><p className="tiny muted">By continuing, you agree to use LOVEOGRAM respectfully and safely.</p></section></main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState('Pulse');
  const [draft, setDraft] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState('');
  const [profileName, setProfileName] = useState('Your space');
  const configured = Boolean(supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPosts = async () => {
    if (!supabase) return; setLoading(true);
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) setNotice('Feed could not load: ' + error.message);
    else setPosts((data ?? []) as Post[]);
    setLoading(false);
  };
  useEffect(() => { if (session) { void loadPosts(); const name = session.user.user_metadata?.username; if (name) setProfileName(String(name)); } }, [session]);

  const publish = async () => {
    if (!supabase || !session || !draft.trim()) return; setPublishing(true); setNotice('');
    const { error } = await supabase.from('posts').insert({ user_id: session.user.id, content: draft.trim() });
    setPublishing(false);
    if (error) setNotice('Post was not published: ' + error.message);
    else { setDraft(''); setNotice('Your moment has been shared.'); await loadPosts(); }
  };
  const displayPosts = useMemo(() => posts, [posts]);

  if (!configured) return <main className="setup-screen"><div className="brand-mark">L<span>♥</span></div><h1>One small setup step.</h1><p>Add your Supabase project URL and publishable key as environment variables to enable sign-in and live data.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code><p className="muted">Use the publishable/anon key only. Never put a service-role or secret key in frontend code.</p></main>;
  if (!session) return <AuthPanel />;

  return <div className="app-layout"><aside className="sidebar"><a className="wordmark" href="#"><span className="brand-mark small">L<span>♥</span></span> LOVEOGRAM</a><nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-link selected' : 'nav-link'} onClick={() => setActive(label)}><Icon size={19}/>{label}</button>)}</nav><button className="primary create-side" onClick={() => document.getElementById('composer')?.focus()}><Plus size={18}/> Create moment</button><div className="sidebar-bottom"><div className="avatar">{profileName.slice(0,1).toUpperCase()}</div><div className="user-label"><b>{profileName}</b><small>@{profileName.toLowerCase().replace(/\s/g,'')}</small></div><button className="icon-btn" aria-label="Sign out" onClick={() => supabase?.auth.signOut()}><LogOut size={18}/></button></div></aside>
  <main className="main-content"><header className="topbar"><div><span className="eyebrow">YOUR DAILY SPACE</span><h2>{active}</h2></div><div className="top-actions"><button className="icon-btn"><Search/></button><button className="icon-btn"><Menu/></button></div></header>
  <div className="content-grid"><section className="feed-column"><div className="welcome-banner"><div><span className="eyebrow">A LITTLE SPACE TO BE YOU</span><h2>Every moment has<br/><em>a place here.</em></h2><p>Share a thought. Celebrate a little win. Connect for real.</p></div><div className="banner-spark"><Sparkles size={38}/></div></div>
  {notice && <div className="notice">{notice}</div>}
  <section className="composer"><div className="avatar">{profileName.slice(0,1).toUpperCase()}</div><div className="composer-body"><textarea id="composer" value={draft} onChange={e => setDraft(e.target.value)} placeholder="What’s on your mind today?" rows={3}/><div className="composer-footer"><span><ImageIcon size={16}/> Add a photo (coming next)</span><button className="primary" disabled={!draft.trim() || publishing} onClick={publish}>{publishing ? 'Sharing…' : 'Share moment'} <span>↗</span></button></div></div></section>
  <div className="section-heading"><h3>Latest moments</h3><button onClick={() => void loadPosts()}>Refresh</button></div>
  {loading && <p className="muted">Loading moments…</p>}
  {!loading && displayPosts.length === 0 && <div className="empty-state"><div className="empty-icon"><Heart/></div><h3>Your feed starts here</h3><p>When people share moments, they’ll appear here. Be the first to post something.</p></div>}
  {displayPosts.map(post => <article className="post-card" key={post.id}><div className="post-head"><div className="avatar">L</div><div><b>LOVEOGRAM member</b><small>{post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</small></div><span className="post-dot">•••</span></div><p>{String(post.content ?? post.body ?? post.caption ?? 'A new moment was shared.')}</p><div className="post-actions"><button><Heart size={17}/> Like</button><button><MessageCircle size={17}/> Comment</button><button>↗ Share</button></div></article>)}
  </section><aside className="right-rail"><div className="rail-card"><span className="eyebrow">YOUR COMMUNITY</span><h3>Good connections<br/>start with hello.</h3><p>Discover people and circles that share your interests.</p><button className="outline-btn" onClick={() => setActive('Discover')}>Explore people <span>→</span></button></div><div className="rail-card soft"><Sparkles/><h3>Make it yours</h3><p>Your profile and creative space will grow with every moment you share.</p></div></aside></div></main></div>;
}
export default App;
