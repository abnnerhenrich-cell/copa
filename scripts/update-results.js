/*
Atualizador automático do Bolão Brasil.
Modo grátis/efetivo:
1) Com API_FOOTBALL_KEY: busca placares na API-Football e salva no Firestore.
2) Sem API: usa data/jogos-brasil.json para alimentar/atualizar os jogos manualmente.
*/
const fs = require('fs');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!serviceAccount.project_id) {
  console.error('FIREBASE_SERVICE_ACCOUNT não configurado nos Secrets do GitHub.');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const BRAZIL_NAMES = ['Brazil','Brasil','BRA'];
const mapStatus = s => ({ NS:'Agendado', TBD:'Agendado', '1H':'Ao vivo', HT:'Ao vivo', '2H':'Ao vivo', ET:'Ao vivo', P:'Ao vivo', FT:'Encerrado', AET:'Encerrado', PEN:'Encerrado' }[s] || 'Agendado');
function brFlag(name){ return name?.toLowerCase().includes('brazil') || name?.toLowerCase().includes('brasil') ? '🇧🇷' : '🏳️'; }
async function saveGames(games){
  const batch = db.batch();
  games.forEach(g => batch.set(db.collection('games').doc(g.id), g, { merge:true }));
  await batch.commit();
  console.log(`${games.length} jogos salvos/atualizados.`);
}
async function fromLocalJson(){
  const games = JSON.parse(fs.readFileSync('data/jogos-brasil.json','utf8'));
  await saveGames(games);
}
async function fromApiFootball(){
  const key = process.env.API_FOOTBALL_KEY;
  const teamId = process.env.API_FOOTBALL_BRAZIL_TEAM_ID || '6';
  const leagueId = process.env.API_FOOTBALL_LEAGUE_ID || '1';
  const season = process.env.API_FOOTBALL_SEASON || '2026';
  const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&team=${teamId}`;
  const res = await fetch(url, { headers: { 'x-apisports-key': key }});
  if(!res.ok) throw new Error(`Erro API-Football: ${res.status}`);
  const data = await res.json();
  const fixtures = data.response || [];
  const games = fixtures.filter(f => BRAZIL_NAMES.some(n => `${f.teams.home.name} ${f.teams.away.name} ${f.teams.home.code||''} ${f.teams.away.code||''}`.includes(n))).map(f => ({
    id: String(f.fixture.id),
    phase: f.league.round || 'Copa 2026',
    date: f.fixture.date,
    home: f.teams.home.name === 'Brazil' ? 'Brasil' : f.teams.home.name,
    homeCode: f.teams.home.code || '',
    homeFlag: brFlag(f.teams.home.name),
    away: f.teams.away.name === 'Brazil' ? 'Brasil' : f.teams.away.name,
    awayCode: f.teams.away.code || '',
    awayFlag: brFlag(f.teams.away.name),
    stadium: [f.fixture.venue?.name, f.fixture.venue?.city].filter(Boolean).join(', ') || 'A definir',
    status: mapStatus(f.fixture.status?.short),
    score: Number.isFinite(f.goals.home) && Number.isFinite(f.goals.away) ? { home:f.goals.home, away:f.goals.away } : null,
    updatedAt: new Date().toISOString()
  }));
  if(!games.length) throw new Error('API retornou 0 jogos do Brasil. Confira TEAM_ID/LEAGUE_ID/SEASON.');
  await saveGames(games);
}
(async()=>{
  try{
    if(process.env.API_FOOTBALL_KEY) await fromApiFootball();
    else await fromLocalJson();
  }catch(e){ console.error(e); process.exit(1); }
})();
