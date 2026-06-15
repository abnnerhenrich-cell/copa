import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const appEl = document.getElementById('app');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let state = { user:null, profile:null, page:'home', games:[], bets:{}, ranking:[], toast:'', tab:'todos' };

const q = s => document.querySelector(s);
const fmt = d => new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const safe = v => String(v||'').replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
const canBet = g => g.status !== 'Encerrado' && new Date(g.date) > new Date();
function toast(t){ state.toast=t; render(); setTimeout(()=>{state.toast='';render()},2200); }
function nav(p){ state.page=p; render(); scrollTo(0,0); }
window.nav=nav;

async function login(e){
 e.preventDefault(); const f=new FormData(e.target); const email=f.get('email').trim(); const pass=f.get('pass').trim(); const name=f.get('name').trim();
 try{
   let cred;
   try{ cred = await signInWithEmailAndPassword(auth,email,pass); }
   catch{ cred = await createUserWithEmailAndPassword(auth,email,pass); }
   await setDoc(doc(db,'users',cred.user.uid), { name:name||email.split('@')[0], email, updatedAt:serverTimestamp() }, { merge:true });
 }catch(err){ toast('Erro no login: confira e-mail e senha.'); }
}
window.login=login;
window.logout=()=>signOut(auth);

async function bet(gid,h,a){
 if(!state.user) return; const g=state.games.find(x=>x.id===gid); if(!g || !canBet(g)) return toast('Palpite fechado para este jogo.');
 h=Math.max(0,Number(h)||0); a=Math.max(0,Number(a)||0);
 await setDoc(doc(db,'bets',`${state.user.uid}_${gid}`), { userId:state.user.uid, gameId:gid, home:h, away:a, updatedAt:serverTimestamp() }, { merge:true });
 toast('Palpite salvo!');
}
window.bet=bet;

function scoreBet(b,g){ if(!g?.score) return 0; const gh=g.score.home, ga=g.score.away; if(b.home===gh && b.away===ga) return 3; if(Math.sign(b.home-b.away)===Math.sign(gh-ga)) return 1; return 0; }
function buildRanking(){
 const map = new Map(); state.ranking.forEach(u=>map.set(u.id,{...u,points:0,total:0}));
 Object.values(state.bets).forEach(b=>{ const g=state.games.find(x=>x.id===b.gameId); const u=map.get(b.userId); if(u){ u.points += scoreBet(b,g); u.total++; }});
 return [...map.values()].sort((a,b)=>b.points-a.points || a.name.localeCompare(b.name));
}
function myBets(){ return Object.fromEntries(Object.values(state.bets).filter(b=>b.userId===state.user?.uid).map(b=>[b.gameId,b])); }

function loginView(){ return `<div class="login-wrap"><form class="login card" onsubmit="login(event)"><div class="logo" style="margin:auto;font-size:24px">🇧🇷</div><h1>Bolão Brasil 2026</h1><p class="muted">Entre ou crie sua conta para palpitar nos jogos do Brasil.</p><input name="name" placeholder="Nome completo"><input name="email" type="email" placeholder="E-mail" required><input name="pass" type="password" placeholder="Senha" required minlength="6"><button>Entrar / Criar conta</button></form></div>`; }
function shell(content){ return `<div class="app"><div class="top"><div class="brand"><div class="logo">🇧🇷</div><b>Bolão Brasil</b></div><div><button class="iconbtn" onclick="nav('admin')">⚙️</button> <button class="avatar" onclick="logout()">${safe((state.profile?.name||'U')[0]).toUpperCase()}</button></div></div><main class="page">${content}</main><nav class="bottom"><button class="${state.page==='home'?'active':''}" onclick="nav('home')"><span>🏠</span>Início</button><button class="${state.page==='games'?'active':''}" onclick="nav('games')"><span>⚽</span>Jogos</button><button class="${state.page==='ranking'?'active':''}" onclick="nav('ranking')"><span>📊</span>Ranking</button><button class="${state.page==='stats'?'active':''}" onclick="nav('stats')"><span>📈</span>Stats</button></nav>${state.toast?`<div class="toast">${state.toast}</div>`:''}</div>`; }
function home(){ const next=state.games.filter(g=>g.status!=='Encerrado').slice(0,3); return `<section class="hero card"><div style="font-size:54px">🇧🇷</div><h1>Bolão Brasil 2026</h1><p class="muted">Somente jogos da Seleção Brasileira · ranking automático · atualização em tempo real pelo Firebase.</p><div class="grid3"><div class="mini"><b>${state.games.length}</b><span>Jogos</span></div><div class="mini"><b>${Object.keys(myBets()).length}</b><span>Palpites</span></div><div class="mini"><b>${buildRanking().find(u=>u.id===state.user?.uid)?.points||0}</b><span>Pontos</span></div></div></section><div class="section"><h2>Próximos jogos</h2><span class="pill" onclick="nav('games')">Ver todos</span></div><div class="grid-cards">${next.map(card).join('')||'<div class="card">Nenhum jogo disponível.</div>'}</div>`; }
function card(g){ const b=myBets()[g.id]||{home:0,away:0}; const lock=!canBet(g); return `<article class="card match"><div class="match-head"><span class="pill">${safe(g.phase||'Brasil')}</span><span>${fmt(g.date)} <b class="pill ${g.status==='Encerrado'?'closed':g.status==='Ao vivo'?'live':'soon'}">${safe(g.status||'Agendado')}</b></span></div><div class="teams"><div><div class="flag">${g.homeFlag||'🇧🇷'}</div><div class="team">${safe(g.home)}</div><div class="abbr">${safe(g.homeCode)}</div></div><div class="vs">${g.score?`<span class="score">${g.score.home} - ${g.score.away}</span>`:'VS'}</div><div><div class="flag">${g.awayFlag||'🏳️'}</div><div class="team">${safe(g.away)}</div><div class="abbr">${safe(g.awayCode)}</div></div></div>${g.score?`<p class="muted">Seu palpite: ${b.gameId?`${b.home} x ${b.away}`:'sem palpite'} · Pontos: ${scoreBet(b,g)}</p>`:`<div class="bet-title">🎯 Fazer palpite</div><div class="bet-row"><div><p class="muted">${safe(g.home)}</p><div class="counter"><button ${lock?'disabled':''} onclick="bet('${g.id}',${b.home-1},${b.away})">−</button><div class="num">${b.home}</div><button ${lock?'disabled':''} onclick="bet('${g.id}',${b.home+1},${b.away})">+</button></div></div><b>×</b><div><p class="muted">${safe(g.away)}</p><div class="counter"><button ${lock?'disabled':''} onclick="bet('${g.id}',${b.home},${b.away-1})">−</button><div class="num">${b.away}</div><button ${lock?'disabled':''} onclick="bet('${g.id}',${b.home},${b.away+1})">+</button></div></div></div><button class="save" onclick="toast('Palpite já está salvo automaticamente!')">Salvar palpite</button>`}<div class="loc">📍 ${safe(g.stadium||'A definir')}</div></article>`; }
function games(){ const list=state.tab==='abertos'?state.games.filter(canBet):state.tab==='encerrados'?state.games.filter(g=>g.status==='Encerrado'):state.games; return `<div class="section"><h2>⚽ Jogos do Brasil</h2><span class="pill">${list.length}</span></div><div class="tabs"><button class="${state.tab==='todos'?'active':''}" onclick="state.tab='todos';render()">Todos</button><button class="${state.tab==='abertos'?'active':''}" onclick="state.tab='abertos';render()">Abertos</button><button class="${state.tab==='encerrados'?'active':''}" onclick="state.tab='encerrados';render()">Encerrados</button></div><div class="grid-cards">${list.map(card).join('')||'<div class="card">Nenhum jogo nesta aba.</div>'}</div>`; }
function ranking(){ const r=buildRanking(); return `<div class="section"><h2>📊 Ranking</h2><span class="pill">Atualiza sozinho</span></div><div class="card"><div class="rank-row"><b>#</b><b>Jogador</b><b>Pontos</b></div>${r.map((u,i)=>`<div class="rank-row"><b>${i+1}</b><span>${safe(u.name)}</span><b>${u.points}</b></div>`).join('')}</div>`; }
function stats(){ const bets=Object.values(myBets()), me=buildRanking().find(u=>u.id===state.user?.uid)||{}; return `<div class="section"><h2>📈 Minhas estatísticas</h2></div><div class="grid3"><div class="mini"><b>${me.points||0}</b><span>Pontos</span></div><div class="mini"><b>${bets.length}</b><span>Palpites</span></div><div class="mini"><b>${buildRanking().findIndex(u=>u.id===state.user?.uid)+1 || '-'}</b><span>Posição</span></div></div><div class="card"><p class="muted">Placar exato = 3 pontos. Acertou vencedor ou empate = 1 ponto. Errou = 0.</p></div>`; }
async function seedManual(){
 const text=q('#manualJson').value; try{ const games=JSON.parse(text); for(const g of games) await setDoc(doc(db,'games',g.id),g,{merge:true}); toast('Jogos enviados para o Firebase.'); }catch{ toast('JSON inválido.'); }
}
window.seedManual=seedManual;
function admin(){ return `<div class="section"><h2>⚙️ Admin rápido</h2></div><div class="card admin"><p class="muted">Use só se a automação ainda não estiver ligada. Cole um JSON de jogos e envie para o Firebase.</p><textarea id="manualJson">${JSON.stringify(state.games,null,2)}</textarea><button class="save" onclick="seedManual()">Enviar jogos para o Firebase</button></div>`; }
function render(){ if(!state.user){appEl.innerHTML=loginView(); return;} const pages={home,games,ranking,stats,admin}; appEl.innerHTML=shell((pages[state.page]||home)()); }

onAuthStateChanged(auth, async user=>{
 state.user=user; if(!user){render(); return;}
 const us=doc(db,'users',user.uid); const snap=await getDoc(us); state.profile=snap.exists()?snap.data():{name:user.email};
 onSnapshot(collection(db,'games'), s=>{ state.games=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(a.date)-new Date(b.date)); render(); });
 onSnapshot(collection(db,'bets'), s=>{ state.bets=Object.fromEntries(s.docs.map(d=>[d.id,d.data()])); render(); });
 onSnapshot(collection(db,'users'), s=>{ state.ranking=s.docs.map(d=>({id:d.id,...d.data()})); render(); });
});

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
