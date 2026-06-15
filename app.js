import { firebaseConfig, ADMIN_EMAILS, ADMIN_PIN } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot,
  serverTimestamp, getDocs, deleteDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const appEl = document.getElementById('app');
const isConfigured = firebaseConfig?.apiKey && !String(firebaseConfig.apiKey).includes('COLE_AQUI');

let app, auth, db;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

let state = {
  user: null,
  profile: null,
  page: 'home',
  games: [],
  bets: {},
  users: [],
  toast: '',
  tab: 'todos',
  adminOk: localStorage.getItem('adminOk') === 'yes',
  loading: true
};
window.state = state;

function loadLocal(){
  state.games = JSON.parse(localStorage.getItem('local_games') || 'null') || demoGames;
  state.bets = JSON.parse(localStorage.getItem('local_bets') || '{}');
  state.users = JSON.parse(localStorage.getItem('local_users') || '[]');
}
function saveLocal(){
  localStorage.setItem('local_games', JSON.stringify(state.games));
  localStorage.setItem('local_bets', JSON.stringify(state.bets));
  localStorage.setItem('local_users', JSON.stringify(state.users));
}
function localLogin(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const name=(f.get('name')||'Kelly').trim();
  const email=(f.get('email')||'teste@local.com').trim().toLowerCase();
  state.user={uid:'local_'+email.replace(/\W/g,'_'), email};
  state.profile={name:name||email.split('@')[0], email};
  loadLocal();
  if(!state.users.some(u=>u.id===state.user.uid)){ state.users.push({id:state.user.uid,name:state.profile.name,email}); saveLocal(); }
  localStorage.setItem('local_session', JSON.stringify({uid:state.user.uid,email,name:state.profile.name}));
  render();
}
window.localLogin = localLogin;


const demoGames = [
  {id:'bra-mar-2026',phase:'Grupo C',date:'2026-06-13T19:00:00-03:00',home:'Brasil',homeCode:'BRA',homeFlag:'🇧🇷',away:'Marrocos',awayCode:'MAR',awayFlag:'🇲🇦',stadium:'A definir',status:'Encerrado',score:{home:1,away:1}},
  {id:'bra-hti-2026',phase:'Grupo C',date:'2026-06-19T21:30:00-03:00',home:'Brasil',homeCode:'BRA',homeFlag:'🇧🇷',away:'Haiti',awayCode:'HTI',awayFlag:'🇭🇹',stadium:'A definir',status:'Agendado',score:null},
  {id:'sco-bra-2026',phase:'Grupo C',date:'2026-06-24T19:00:00-03:00',home:'Escócia',homeCode:'SCO',homeFlag:'🏴',away:'Brasil',awayCode:'BRA',awayFlag:'🇧🇷',stadium:'A definir',status:'Agendado',score:null}
];

const $ = s => document.querySelector(s);
const safe = v => String(v ?? '').replace(/[<>&"']/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'}[s]));
const fmt = d => new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const onlyDate = d => new Date(d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
const canBet = g => g.status !== 'Encerrado' && new Date(g.date) > new Date();
const isAdminEmail = () => ADMIN_EMAILS?.map(e=>e.toLowerCase()).includes(state.user?.email?.toLowerCase());
const isAdmin = () => state.adminOk || isAdminEmail();

function toast(t){ state.toast=t; render(); setTimeout(()=>{ state.toast=''; render(); },2300); }
function nav(p){ state.page=p; render(); setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),10); }
window.nav = nav;

async function login(e){
  e.preventDefault();
  if(!isConfigured) return toast('Configure o Firebase primeiro.');
  const f = new FormData(e.target);
  const name = f.get('name').trim();
  const email = f.get('email').trim().toLowerCase();
  const pass = f.get('pass').trim();
  try {
    let cred;
    try { cred = await signInWithEmailAndPassword(auth,email,pass); }
    catch { cred = await createUserWithEmailAndPassword(auth,email,pass); }
    await setDoc(doc(db,'users',cred.user.uid), {
      name: name || email.split('@')[0], email, updatedAt: serverTimestamp()
    }, { merge: true });
  } catch(err) {
    toast('Não consegui entrar. Confira e-mail e senha.');
  }
}
window.login = login;
window.logout = () => { if(isConfigured && auth) signOut(auth); else { localStorage.removeItem('local_session'); state.user=null; state.profile=null; render(); } };

async function saveBet(gid, h, a){
  if(!state.user) return toast('Entre para palpitar.');
  const g = state.games.find(x=>x.id===gid);
  if(!g || !canBet(g)) return toast('Palpite fechado para este jogo.');
  h = Math.max(0, Number(h)||0); a = Math.max(0, Number(a)||0);
  const betPayload = {
    userId: state.user.uid,
    userName: state.profile?.name || state.user.email,
    userEmail: state.user.email,
    gameId: gid,
    gameLabel: `${g.home} x ${g.away}`,
    home: h,
    away: a,
    updatedAt: new Date().toISOString()
  };
  if(!isConfigured){ state.bets[`${state.user.uid}_${gid}`]=betPayload; saveLocal(); localStorage.removeItem(`draft_${gid}`); toast('Palpite salvo!'); render(); return; }
  await setDoc(doc(db,'bets',`${state.user.uid}_${gid}`), {
    userId: state.user.uid,
    userName: state.profile?.name || state.user.email,
    userEmail: state.user.email,
    gameId: gid,
    gameLabel: `${g.home} x ${g.away}`,
    home: h,
    away: a,
    updatedAt: serverTimestamp()
  }, { merge: true });
  toast('Palpite salvo!');
}
window.saveBet = saveBet;

function changeDraft(id, side, delta){
  const key = `draft_${id}`;
  const b = JSON.parse(localStorage.getItem(key) || 'null') || myBets()[id] || {home:0,away:0};
  b[side] = Math.max(0, (Number(b[side])||0) + delta);
  localStorage.setItem(key, JSON.stringify(b));
  render();
}
window.changeDraft = changeDraft;
function getDraft(gid){
  return JSON.parse(localStorage.getItem(`draft_${gid}`) || 'null') || myBets()[gid] || {home:0,away:0};
}

function scoreBet(b,g){
  if(!b || !g?.score) return 0;
  const gh=Number(g.score.home), ga=Number(g.score.away);
  if(Number(b.home)===gh && Number(b.away)===ga) return 3;
  if(Math.sign(Number(b.home)-Number(b.away)) === Math.sign(gh-ga)) return 1;
  return 0;
}
function myBets(){ return Object.fromEntries(Object.values(state.bets).filter(b=>b.userId===state.user?.uid).map(b=>[b.gameId,b])); }
function buildRanking(){
  const map = new Map();
  state.users.forEach(u => map.set(u.id,{...u,points:0,total:0,exact:0}));
  Object.values(state.bets).forEach(b => {
    const g = state.games.find(x=>x.id===b.gameId);
    if(!map.has(b.userId)) map.set(b.userId,{id:b.userId,name:b.userName||'Jogador',email:b.userEmail||'',points:0,total:0,exact:0});
    const u = map.get(b.userId); const pts = scoreBet(b,g);
    u.points += pts; u.total += 1; if(pts===3) u.exact += 1;
  });
  return [...map.values()].sort((a,b)=>b.points-a.points || b.exact-a.exact || String(a.name).localeCompare(String(b.name)));
}
function allBets(){
  return Object.values(state.bets).sort((a,b)=>String(a.gameLabel).localeCompare(String(b.gameLabel)) || String(a.userName).localeCompare(String(b.userName)));
}

function loginView(){
  if(!isConfigured) return `<div class="login-wrap"><form class="login card" onsubmit="localLogin(event)"><div class="logo" style="margin:auto;font-size:24px">🇧🇷</div><h1>Bolão Brasil 2026</h1><p class="muted">Modo teste local: todos os botões funcionam no celular. Para salvar online para todos, configure o Firebase depois.</p><input name="name" placeholder="Seu nome" value="Kelly"><input name="email" type="email" placeholder="E-mail" value="teste@local.com"><button>Entrar e testar</button><div class="warnbox" style="margin-top:12px">Firebase ainda não configurado. Os dados ficam salvos só neste aparelho.</div></form></div>`;
  return `<div class="login-wrap"><form class="login card" onsubmit="login(event)">
    <div class="logo" style="margin:auto;font-size:24px">🇧🇷</div><h1>Bolão Brasil 2026</h1>
    <p class="muted">Entre ou crie sua conta para palpitar nos jogos do Brasil.</p>
    <input name="name" placeholder="Seu nome">
    <input name="email" type="email" placeholder="E-mail" required>
    <input name="pass" type="password" placeholder="Senha" required minlength="6">
    <button>Entrar / Criar conta</button>
    <p class="muted" style="font-size:.82rem">Admin: entre com seu e-mail e depois use o botão ⚙️.</p>
  </form></div>`;
}
function shell(content){
  return `<div class="app">
    <header class="top"><div class="brand"><div class="logo">🇧🇷</div><div class="brand-title"><b>Bolão Brasil</b><small>Jogos do Brasil · 2026</small></div></div><div class="top-actions"><button class="iconbtn" onclick="nav('admin')">⚙️</button><button class="avatar" onclick="logout()">${safe((state.profile?.name||state.user?.email||'U')[0]).toUpperCase()}</button></div></header>
    <main class="page">${content}</main>
    <nav class="bottom">
      <button class="${state.page==='home'?'active':''}" onclick="nav('home')"><span>🏠</span>Início</button>
      <button class="${state.page==='games'?'active':''}" onclick="nav('games')"><span>⚽</span>Jogos</button>
      <button class="${state.page==='ranking'?'active':''}" onclick="nav('ranking')"><span>🏆</span>Ranking</button>
      <button class="${state.page==='stats'?'active':''}" onclick="nav('stats')"><span>📈</span>Stats</button>
      <button class="${state.page==='admin'?'active':''}" onclick="nav('admin')"><span>🔐</span>Admin</button>
    </nav>${state.toast?`<div class="toast">${safe(state.toast)}</div>`:''}</div>`;
}
function home(){
  const rank = buildRanking(); const me = rank.find(u=>u.id===state.user?.uid) || {};
  const next = state.games.filter(g=>g.status!=='Encerrado').slice(0,2);
  return `<section class="hero card"><div class="cup">🇧🇷⚽</div><h1>Bolão Brasil 2026</h1><p class="muted">Visual novo, mobile otimizado, ranking automático e painel admin para acompanhar todos os palpites.</p><div class="grid3"><div class="mini"><b>${state.games.length}</b><span>Jogos</span></div><div class="mini"><b>${Object.keys(myBets()).length}</b><span>Meus palpites</span></div><div class="mini"><b>${me.points||0}</b><span>Pontos</span></div></div></section><div class="section"><h2>Próximos jogos</h2><button class="pill" onclick="nav('games')">Ver todos</button></div><div class="grid-cards">${next.map(card).join('') || `<div class="card empty">Nenhum jogo disponível.</div>`}</div>`;
}
function statusPill(g){ return `<b class="pill ${g.status==='Encerrado'?'closed':g.status==='Ao vivo'?'live':'soon'}">${safe(g.status||'Agendado')}</b>`; }
function card(g){
  const saved = myBets()[g.id]; const b = getDraft(g.id); const lock = !canBet(g);
  return `<article class="card match">
    <div class="match-head"><span class="pill">${safe(g.phase||'Brasil')}</span><span>${fmt(g.date)} ${statusPill(g)}</span></div>
    <div class="teams"><div><div class="flag">${g.homeFlag||'🏳️'}</div><div class="team">${safe(g.home)}</div><div class="abbr">${safe(g.homeCode)}</div></div><div class="vs">${g.score?`<span class="score">${g.score.home} - ${g.score.away}</span>`:'VS'}</div><div><div class="flag">${g.awayFlag||'🏳️'}</div><div class="team">${safe(g.away)}</div><div class="abbr">${safe(g.awayCode)}</div></div></div>
    ${g.score?`<p class="muted">Seu palpite: <b>${saved?`${saved.home} x ${saved.away}`:'sem palpite'}</b> · Pontos: <b>${scoreBet(saved,g)}</b></p>`:`<div class="bet-title">🎯 Seu palpite</div><div class="bet-row"><div><p class="muted">${safe(g.home)}</p><div class="counter"><button ${lock?'disabled':''} onclick="changeDraft('${g.id}','home',-1)">−</button><div class="num">${b.home}</div><button ${lock?'disabled':''} onclick="changeDraft('${g.id}','home',1)">+</button></div></div><b>×</b><div><p class="muted">${safe(g.away)}</p><div class="counter"><button ${lock?'disabled':''} onclick="changeDraft('${g.id}','away',-1)">−</button><div class="num">${b.away}</div><button ${lock?'disabled':''} onclick="changeDraft('${g.id}','away',1)">+</button></div></div></div><button class="save" ${lock?'disabled':''} onclick="saveBet('${g.id}',${b.home},${b.away})">Salvar palpite</button>${saved?`<p class="muted" style="text-align:center">Salvo: <b>${saved.home} x ${saved.away}</b></p>`:''}`}
    <div class="loc">📅 ${onlyDate(g.date)} · 📍 ${safe(g.stadium||'A definir')}</div>
  </article>`;
}
function games(){
  const list = state.tab==='abertos'?state.games.filter(canBet):state.tab==='encerrados'?state.games.filter(g=>g.status==='Encerrado'):state.games;
  return `<div class="section"><h2>⚽ Jogos do Brasil</h2><span class="pill">${list.length} jogos</span></div><div class="tabs"><button class="${state.tab==='todos'?'active':''}" onclick="state.tab='todos';render()">Todos</button><button class="${state.tab==='abertos'?'active':''}" onclick="state.tab='abertos';render()">Abertos</button><button class="${state.tab==='encerrados'?'active':''}" onclick="state.tab='encerrados';render()">Encerrados</button></div><div class="grid-cards">${list.map(card).join('') || `<div class="card empty">Nenhum jogo nesta aba.</div>`}</div>`;
}
function ranking(){
  const r = buildRanking();
  return `<div class="section"><h2>🏆 Ranking</h2><span class="pill">${r.length} jogadores</span></div><div class="card"><div class="rank-row"><b>#</b><b>Jogador</b><b>Pontos</b></div>${r.map((u,i)=>`<div class="rank-row"><b>${i+1}</b><span>${safe(u.name)}<br><small class="muted">${u.total||0} palpites · ${u.exact||0} exatos</small></span><b>${u.points}</b></div>`).join('') || `<div class="empty">Ranking limpo. Sem palpites ainda.</div>`}</div>`;
}
function stats(){
  const bets=Object.values(myBets()), rank=buildRanking(), pos=rank.findIndex(u=>u.id===state.user?.uid)+1, me=rank.find(u=>u.id===state.user?.uid)||{};
  return `<div class="section"><h2>📈 Minhas estatísticas</h2></div><div class="grid3"><div class="mini"><b>${me.points||0}</b><span>Pontos</span></div><div class="mini"><b>${bets.length}</b><span>Palpites</span></div><div class="mini"><b>${pos||'-'}</b><span>Posição</span></div></div><div class="card"><p class="muted"><b>Regra:</b> placar exato = 3 pontos. Acertou vencedor ou empate = 1 ponto. Errou = 0.</p></div>`;
}

function adminLogin(e){
  e.preventDefault();
  const pin = new FormData(e.target).get('pin');
  if(pin === ADMIN_PIN || isAdminEmail()) { state.adminOk = true; localStorage.setItem('adminOk','yes'); toast('Admin liberado.'); render(); }
  else toast('PIN admin incorreto.');
}
window.adminLogin = adminLogin;

async function seedManual(){
  const text=$('#manualJson').value;
  try{
    const games=JSON.parse(text);
    if(!Array.isArray(games)) throw new Error('precisa ser lista');
    if(!isConfigured){ state.games=games; saveLocal(); toast('Jogos salvos no modo local.'); render(); return; }
    for(const g of games) await setDoc(doc(db,'games',g.id),g,{merge:true});
    toast('Jogos enviados para o Firebase.');
  }catch{ toast('JSON inválido.'); }
}
window.seedManual=seedManual;

async function updateResult(e){
  e.preventDefault();
  const f=new FormData(e.target); const id=f.get('gameId');
  const home=Number(f.get('home')); const away=Number(f.get('away')); const status=f.get('status');
  if(!id) return toast('Escolha um jogo.');
  const payload = { status, updatedAt: serverTimestamp() };
  payload.score = status==='Encerrado' || status==='Ao vivo' ? {home,away} : null;
  if(!isConfigured){
    state.games = state.games.map(g=>g.id===id ? {...g, status, score: payload.score, updatedAt: new Date().toISOString()} : g);
    saveLocal(); toast('Resultado atualizado.'); render(); return;
  }
  await updateDoc(doc(db,'games',id), payload);
  toast('Resultado atualizado.');
}
window.updateResult=updateResult;

async function clearRankingHistory(){
  if(!confirm('Isso vai apagar TODOS os palpites e zerar o ranking. Deseja continuar?')) return;
  if(!isConfigured){ state.bets={}; saveLocal(); toast('Histórico de ranking limpo.'); render(); return; }
  const snap = await getDocs(collection(db,'bets'));
  await Promise.all(snap.docs.map(d=>deleteDoc(doc(db,'bets',d.id))));
  toast('Histórico de ranking limpo.');
}
window.clearRankingHistory=clearRankingHistory;

async function clearAdminAccess(){ localStorage.removeItem('adminOk'); state.adminOk=false; render(); }
window.clearAdminAccess=clearAdminAccess;

function admin(){
  if(!isAdmin()) return `<div class="section"><h2>🔐 Login Admin</h2></div><form class="card login" onsubmit="adminLogin(event)"><p class="muted">Digite o PIN admin para ver todos os palpites e limpar ranking.</p><input name="pin" type="password" placeholder="PIN admin"><button>Entrar no Admin</button><p class="muted">PIN padrão: altere em <b>firebase-config.js</b>.</p></form>`;
  const bets = allBets();
  return `<div class="section"><h2>⚙️ Painel Admin</h2><button class="pill danger" onclick="clearAdminAccess()">Sair admin</button></div>
  <div class="admin-grid">
    <div class="card admin"><h3>👀 Palpites de todos</h3><p class="muted">Total: ${bets.length} palpites</p><div>${bets.map(b=>`<div class="bet-list-row"><span><b>${safe(b.userName||'Jogador')}</b><br><small class="muted">${safe(b.gameLabel||b.gameId)}</small></span><b>${b.home} x ${b.away}</b><small class="muted">${safe(b.userEmail||'')}</small></div>`).join('') || `<div class="empty">Nenhum palpite ainda.</div>`}</div></div>
    <div class="card admin"><h3>🧹 Limpar ranking</h3><p class="muted">O ranking é calculado pelos palpites. Para zerar o histórico, apague todos os palpites.</p><button class="save danger" onclick="clearRankingHistory()">Limpar histórico de ranking</button></div>
  </div>
  <div class="admin-grid">
    <form class="card admin" onsubmit="updateResult(event)"><h3>⚽ Atualizar resultado manual</h3><select name="gameId">${state.games.map(g=>`<option value="${safe(g.id)}">${safe(g.home)} x ${safe(g.away)} - ${fmt(g.date)}</option>`).join('')}</select><div class="grid3"><input name="home" type="number" min="0" value="0"><input name="away" type="number" min="0" value="0"><select name="status"><option>Agendado</option><option>Ao vivo</option><option>Encerrado</option></select></div><button class="save">Salvar resultado</button></form>
    <div class="card admin"><h3>📥 Enviar jogos JSON</h3><p class="muted">Use se a automação ainda não estiver ligada.</p><textarea id="manualJson">${safe(JSON.stringify(state.games.length?state.games:demoGames,null,2))}</textarea><button class="save secondary" onclick="seedManual()">Enviar jogos</button></div>
  </div>`;
}

function render(){
  if(!state.user){ appEl.innerHTML = loginView(); return; }
  const pages={home,games,ranking,stats,admin};
  appEl.innerHTML = shell((pages[state.page]||home)());
}

if(isConfigured){
  onAuthStateChanged(auth, async user=>{
    state.user=user; state.loading=false;
    if(!user){ render(); return; }
    const us=doc(db,'users',user.uid); const snap=await getDoc(us);
    state.profile=snap.exists()?snap.data():{name:user.email,email:user.email};
    await setDoc(us,{email:user.email, name:state.profile.name || user.email.split('@')[0], updatedAt:serverTimestamp()},{merge:true});
    onSnapshot(collection(db,'games'), s=>{ state.games=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(a.date)-new Date(b.date)); render(); }, err=>toast('Erro ao ler jogos. Verifique regras do Firestore.'));
    onSnapshot(collection(db,'bets'), s=>{ state.bets=Object.fromEntries(s.docs.map(d=>[d.id,d.data()])); render(); }, err=>toast('Erro ao ler palpites.'));
    onSnapshot(collection(db,'users'), s=>{ state.users=s.docs.map(d=>({id:d.id,...d.data()})); render(); }, err=>toast('Erro ao ler usuários.'));
  });
} else {
  state.loading=false;
  const sess = JSON.parse(localStorage.getItem('local_session') || 'null');
  if(sess){ state.user={uid:sess.uid,email:sess.email}; state.profile={name:sess.name,email:sess.email}; loadLocal(); }
  render();
}

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
