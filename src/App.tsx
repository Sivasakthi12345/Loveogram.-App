import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { Heart, Home, Compass, MessageCircle, Bell, Plus, Search, Sparkles, LogOut, Image as ImageIcon, UserRound, Menu, Send, Users, RefreshCw } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type Post = { id: string; body?: string; created_at?: string; author_id?: string };
type Profile = { id: string; username: string; display_name?: string; bio?: string; avatar_url?: string | null };
type Conversation = { conversation_id: string; conversations: { id: string; title?: string | null; is_group: boolean; created_at: string } | null };
type Message = { id: string; sender_id: string; body: string; created_at: string };\ntype Comment = { id: string; author_id: string; body: string; created_at: string };
type Notice = { id: string; kind: string; body: string; created_at: string; read_at?: string | null };
const navItems = [{ label: 'Pulse', icon: Home }, { label: 'Discover', icon: Compass }, { label: 'Chat', icon: MessageCircle }, { label: 'Notifications', icon: Bell }, { label: 'My Space', icon: UserRound }];

function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return; setBusy(true); setError('');
    const result = mode === 'signup' ? await supabase.auth.signUp({ email, password, options: { data: { username } } }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (result.error) setError(result.error.message); else if (mode === 'signup' && !result.data.session) setError('Check your email to confirm your account, then sign in.');
  };
  return <main className="auth-shell"><div className="auth-glow" /><section className="auth-card"><div className="brand-mark">L<span>♥</span></div><p className="eyebrow">YOUR PEOPLE. YOUR MOMENTS.</p><h1>Feel closer.<br/><em>Be yourself.</em></h1><p className="muted">A new space for real connections and the moments that matter.</p><div className="tabs"><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button></div><form onSubmit={submit}>{mode === 'signup' && <label>Username<input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" minLength={3} required /></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>{error && <p className="error">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create your account' : 'Sign in'} <span>→</span></button></form><p className="tiny muted">By continuing, you agree to use LOVEOGRAM respectfully and safely.</p></section></main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]); const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]); const [selectedChat, setSelectedChat] = useState<string | null>(null);\n  const [likedPosts, setLikedPosts] = useState<string[]>([]); const [commentPost, setCommentPost] = useState<string | null>(null); const [comments, setComments] = useState<Comment[]>([]); const [commentDraft, setCommentDraft] = useState('');
  const [loading, setLoading] = useState(false); const [active, setActive] = useState('Pulse');
  const [draft, setDraft] = useState(''); const [chatDraft, setChatDraft] = useState('');
  const [publishing, setPublishing] = useState(false); const [notice, setNotice] = useState('');
  const [profileName, setProfileName] = useState('Your space'); const [bio, setBio] = useState('');
  const [searchText, setSearchText] = useState(''); const [searchOpen, setSearchOpen] = useState(false);
  const configured = Boolean(supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPosts = async () => {
    if (!supabase) return; setLoading(true);
    const { data, error } = await supabase.from('posts').select('id,body,created_at,author_id').order('created_at', { ascending: false }).limit(50);
    if (error) setNotice('Feed could not load: ' + error.message); else setPosts((data ?? []) as Post[]);
    setLoading(false);
  };
  const loadProfiles = async () => {
    if (!supabase || !session) return; setLoading(true);
    const { data, error } = await supabase.from('profiles').select('id,username,display_name,bio,avatar_url').neq('id', session.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) setNotice('Discover could not load: ' + error.message); else setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  };
  const loadChats = async () => {
    if (!supabase || !session) return; setLoading(true);
    const { data, error } = await supabase.from('conversation_members').select('conversation_id,conversations(id,title,is_group,created_at)').eq('user_id', session.user.id);
    if (error) setNotice('Chats could not load: ' + error.message); else setConversations((data ?? []) as unknown as Conversation[]);
    setLoading(false);
  };
  const loadNotifications = async () => {
    if (!supabase || !session) return; setLoading(true);
    const { data, error } = await supabase.from('notifications').select('id,kind,body,created_at,read_at').eq('recipient_id', session.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) setNotice('Notifications could not load: ' + error.message); else setNotifications((data ?? []) as Notice[]);
    setLoading(false);
  };
  const loadProfile = async () => {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from('profiles').select('display_name,username,bio').eq('id', session.user.id).maybeSingle();
    if (error) { setNotice('Profile could not load: ' + error.message); return; }
    if (data) { setProfileName(data.display_name || data.username || 'Your space'); setBio(data.bio || ''); }
    else setProfileName(String(session.user.user_metadata?.username || 'Your space'));
  };
  const loadMessages = async (conversationId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(100);
    if (error) setNotice('Messages could not load: ' + error.message); else setMessages((data ?? []) as Message[]);
  };
  useEffect(() => { if (session) { void loadPosts(); void loadProfile(); } }, [session]);
  useEffect(() => {
    if (!session) return;
    setNotice('');
    if (active === 'Discover') void loadProfiles();
    if (active === 'Chat') void loadChats();
    if (active === 'Notifications') void loadNotifications();
    if (active === 'My Space') void loadProfile();
  }, [active, session]);
  useEffect(() => { if (selectedChat) void loadMessages(selectedChat); }, [selectedChat]);

  const publish = async () => {
    if (!supabase || !session || !draft.trim()) return; setPublishing(true); setNotice('');
    const { error } = await supabase.from('posts').insert({ author_id: session.user.id, body: draft.trim() });
    setPublishing(false); if (error) setNotice('Post was not published: ' + error.message);
    else { setDraft(''); setNotice('Your moment has been shared.'); await loadPosts(); }
  };
  const toggleLike = async (postId: string) => {\n    if (!supabase || !session) return;\n    const alreadyLiked = likedPosts.includes(postId);\n    const result = alreadyLiked ? await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', session.user.id) : await supabase.from('reactions').upsert({ post_id: postId, user_id: session.user.id, reaction: 'like' }, { onConflict: 'user_id,post_id' });\n    if (result.error) setNotice('Reaction could not be saved: ' + result.error.message); else setLikedPosts(current => alreadyLiked ? current.filter(id => id !== postId) : [...current, postId]);\n  };\n  const openComments = async (postId: string) => {\n    if (commentPost === postId) { setCommentPost(null); return; }\n    if (!supabase) return; setCommentPost(postId); setComments([]);\n    const { data, error } = await supabase.from('comments').select('id,author_id,body,created_at').eq('post_id', postId).order('created_at', { ascending: true });\n    if (error) setNotice('Comments could not load: ' + error.message); else setComments((data ?? []) as Comment[]);\n  };\n  const addComment = async () => {\n    if (!supabase || !session || !commentPost || !commentDraft.trim()) return;\n    const { error } = await supabase.from('comments').insert({ post_id: commentPost, author_id: session.user.id, body: commentDraft.trim() });\n    if (error) setNotice('Comment could not be posted: ' + error.message); else { setCommentDraft(''); await openComments(commentPost); await openComments(commentPost); }\n  };\n  const follow = async (profileId: string) => {
    if (!supabase || !session) return;
    const { error } = await supabase.from('follows').insert({ follower_id: session.user.id, following_id: profileId, status: 'accepted' });
    setNotice(error ? 'Follow could not be saved: ' + error.message : 'You are now following this member.');
  };
  const saveProfile = async () => {
    if (!supabase || !session) return;
    const { error } = await supabase.from('profiles').update({ display_name: profileName, bio }).eq('id', session.user.id);
    setNotice(error ? 'Profile update failed: ' + error.message : 'Your profile was updated.');
  };
  const sendMessage = async () => {
    if (!supabase || !session || !selectedChat || !chatDraft.trim()) return;
    const { error } = await supabase.from('messages').insert({ conversation_id: selectedChat, sender_id: session.user.id, body: chatDraft.trim() });
    if (error) setNotice('Message could not send: ' + error.message); else { setChatDraft(''); await loadMessages(selectedChat); }
  };
  const visiblePosts = useMemo(() => posts.filter(p => String(p.body || '').toLowerCase().includes(searchText.toLowerCase())), [posts, searchText]);

  if (!configured) return <main className="setup-screen"><div className="brand-mark">L<span>♥</span></div><h1>One small setup step.</h1><p>Add your Supabase project URL and publishable key as environment variables to enable sign-in and live data.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code><p className="muted">Use the publishable/anon key only. Never put a service-role or secret key in frontend code.</p></main>;
  if (!session) return <AuthPanel />;

  const pageTitle = active === 'Pulse' ? 'Pulse' : active;
  return <div className="app-layout"><aside className="sidebar"><a className="wordmark" href="#" onClick={e => { e.preventDefault(); setActive('Pulse'); }}><span className="brand-mark small">L<span>♥</span></span> LOVEOGRAM</a><nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-link selected' : 'nav-link'} onClick={() => { setActive(label); setSelectedChat(null); }}><Icon size={19}/>{label}</button>)}</nav><button className="primary create-side" onClick={() => { setActive('Pulse'); document.getElementById('composer')?.focus(); }}><Plus size={18}/> Create moment</button><div className="sidebar-bottom"><div className="avatar">{profileName.slice(0,1).toUpperCase()}</div><div className="user-label"><b>{profileName}</b><small>@{profileName.toLowerCase().replace(/\s/g,'')}</small></div><button className="icon-btn" aria-label="Sign out" onClick={() => supabase?.auth.signOut()}><LogOut size={18}/></button></div></aside>
  <main className="main-content"><header className="topbar"><div><span className="eyebrow">YOUR DAILY SPACE</span><h2>{pageTitle}</h2></div><div className="top-actions"><button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(v => !v)}><Search/></button><button className="icon-btn" aria-label="Open profile" onClick={() => setActive('My Space')}><Menu/></button></div></header>
  {searchOpen && <div className="search-bar"><Search size={17}/><input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search moments or people…" /><button onClick={() => { setSearchText(''); setSearchOpen(false); }}>Close</button></div>}
  {notice && <div className="notice">{notice}</div>}
  {active === 'Pulse' && <div className="content-grid"><section className="feed-column"><div className="welcome-banner"><div><span className="eyebrow">A LITTLE SPACE TO BE YOU</span><h2>Every moment has<br/><em>a place here.</em></h2><p>Share a thought. Celebrate a little win. Connect for real.</p></div><div className="banner-spark"><Sparkles size={38}/></div></div><section className="composer"><div className="avatar">{profileName.slice(0,1).toUpperCase()}</div><div className="composer-body"><textarea id="composer" value={draft} onChange={e => setDraft(e.target.value)} placeholder="What’s on your mind today?" rows={3}/><div className="composer-footer"><span><ImageIcon size={16}/> Photo uploads coming soon</span><button className="primary" disabled={!draft.trim() || publishing} onClick={publish}>{publishing ? 'Sharing…' : 'Share moment'} <span>↗</span></button></div></div></section><div className="section-heading"><h3>Latest moments</h3><button onClick={() => void loadPosts()}><RefreshCw size={13}/> Refresh</button></div>{loading && <p className="muted">Loading moments…</p>}{!loading && visiblePosts.length === 0 && <div className="empty-state"><div className="empty-icon"><Heart/></div><h3>Your feed starts here</h3><p>When people share moments, they’ll appear here. Be the first to post something.</p></div>}{visiblePosts.map(post => <article className="post-card" key={post.id}><div className="post-head"><div className="avatar">L</div><div><b>LOVEOGRAM member</b><small>{post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</small></div><span className="post-dot">•••</span></div><p>{post.body || 'A new moment was shared.'}</p><div className="post-actions"><button className={likedPosts.includes(post.id) ? "liked" : ""} onClick={() => void toggleLike(post.id)}><Heart size={17} fill={likedPosts.includes(post.id) ? "currentColor" : "none"}/> {likedPosts.includes(post.id) ? "Liked" : "Like"}</button><button onClick={() => void openComments(post.id)}><MessageCircle size={17}/> Comment</button><button onClick={() => { void navigator.clipboard?.writeText(window.location.href); setNotice("Copy the post text to share it with friends."); }}>↗ Share</button></div>{commentPost === post.id && <div className="comments-panel">{comments.map(comment => <div className="comment-row" key={comment.id}><b>Member</b><p>{comment.body}</p></div>)}<div className="comment-compose"><input value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Write a comment…" onKeyDown={e => { if (e.key === "Enter") void addComment(); }}/><button className="primary" disabled={!commentDraft.trim()} onClick={addComment}>Send</button></div></div>}</article>)}</section><aside className="right-rail"><div className="rail-card"><span className="eyebrow">YOUR COMMUNITY</span><h3>Good connections<br/>start with hello.</h3><p>Discover people and circles that share your interests.</p><button className="outline-btn" onClick={() => setActive('Discover')}>Explore people <span>→</span></button></div><div className="rail-card soft"><Sparkles/><h3>Make it yours</h3><p>Your profile and creative space will grow with every moment you share.</p></div></aside></div>}
  {active === 'Discover' && <section className="page-panel"><div className="section-heading"><h3><Users size={18}/> Find your people</h3><button onClick={() => void loadProfiles()}>Refresh</button></div>{loading && <p className="muted">Finding members…</p>}{!loading && profiles.length === 0 && <div className="empty-state"><Compass/><h3>No members to discover yet</h3><p>As more people join LOVEOGRAM, their public profiles will appear here.</p></div>}{profiles.map(p => <article className="member-card" key={p.id}><div className="avatar">{(p.display_name || p.username || '?').slice(0,1).toUpperCase()}</div><div className="member-info"><b>{p.display_name || p.username}</b><small>@{p.username}</small><p>{p.bio || 'A new member of the LOVEOGRAM community.'}</p></div><button className="outline-btn follow-btn" onClick={() => void follow(p.id)}>Follow</button></article>)}</section>}
  {active === 'Chat' && <section className="page-panel"><div className="section-heading"><h3><MessageCircle size={18}/> Your conversations</h3><button onClick={() => void loadChats()}>Refresh</button></div>{selectedChat ? <><button className="outline-btn back-btn" onClick={() => setSelectedChat(null)}>← All conversations</button><div className="message-list">{messages.map(m => <div className={m.sender_id === session.user.id ? 'message-bubble mine' : 'message-bubble'} key={m.id}>{m.body}<small>{new Date(m.created_at).toLocaleString()}</small></div>)}</div><div className="message-compose"><input value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Write a message…" onKeyDown={e => { if (e.key === 'Enter') void sendMessage(); }}/><button className="primary" disabled={!chatDraft.trim()} onClick={sendMessage}><Send size={17}/></button></div></> : <>{loading && <p className="muted">Loading conversations…</p>}{!loading && conversations.length === 0 && <div className="empty-state"><MessageCircle/><h3>No conversations yet</h3><p>When you start a conversation with another member, it will appear here.</p><button className="outline-btn" onClick={() => setActive('Discover')}>Find people to connect with</button></div>}{conversations.map(c => <button className="conversation-row" key={c.conversation_id} onClick={() => setSelectedChat(c.conversation_id)}><div className="avatar"><MessageCircle/></div><span><b>{c.conversations?.title || (c.conversations?.is_group ? 'Group conversation' : 'Direct conversation')}</b><small>Open conversation</small></span><span>›</span></button>)}</>}</section>}
  {active === 'Notifications' && <section className="page-panel"><div className="section-heading"><h3><Bell size={18}/> Recent activity</h3><button onClick={() => void loadNotifications()}>Refresh</button></div>{loading && <p className="muted">Loading notifications…</p>}{!loading && notifications.length === 0 && <div className="empty-state"><Bell/><h3>You're all caught up</h3><p>New follows, reactions and comments will show up here.</p></div>}{notifications.map(n => <article className="notification-row" key={n.id}><div className="empty-icon"><Bell size={17}/></div><div><b>{n.kind.replace('_',' ')}</b><p>{n.body || 'You have a new notification.'}</p><small>{new Date(n.created_at).toLocaleString()}</small></div>{!n.read_at && <span className="unread-dot"/>}</article>)}</section>}
  {active === 'My Space' && <section className="page-panel profile-panel"><div className="profile-hero"><div className="avatar profile-avatar">{profileName.slice(0,1).toUpperCase()}</div><span className="eyebrow">YOUR PERSONAL SPACE</span><h2>{profileName}</h2><p>{session.user.email}</p></div><label>Display name<input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your display name"/></label><label>Bio<textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" rows={4}/></label><button className="primary" onClick={saveProfile}>Save profile</button><button className="outline-btn signout-btn" onClick={() => supabase?.auth.signOut()}><LogOut size={16}/> Sign out</button></section>}
  </main></div>;
}
export default App;