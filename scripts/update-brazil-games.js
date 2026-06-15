// Automação para GitHub Actions + Firebase Admin.
// Usa API gratuita configurada em FOOTBALL_API_URL e FOOTBALL_API_KEY.
// Filtra somente jogos com Brazil/Brasil/BRA e salva em Firestore: colecao 'games'.
const admin = require('firebase-admin');
const fetch = global.fetch;
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
};
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const API_URL = process.env.FOOTBALL_API_URL;
const API_KEY = process.env.FOOTBALL_API_KEY;
function isBrazil(g){const txt=JSON.stringify(g).toLowerCase();return txt.includes('brazil')||txt.includes('brasil')||txt.includes('"bra"')}
async function main(){
  if(!API_URL) throw new Error('Configure FOOTBALL_API_URL nos Secrets do GitHub.');
  const res = await fetch(API_URL,{headers: API_KEY?{'x-apisports-key':API_KEY}:{} });
  const data = await res.json();
  const raw = Array.isArray(data)?data:(data.response||data.matches||data.games||[]);
  const games = raw.filter(isBrazil).map((g,i)=>({
    id: String(g.fixture?.id || g.id || `bra-${i}`),
    home: g.teams?.home?.name || g.homeTeam?.name || g.home || 'Brasil',
    away: g.teams?.away?.name || g.awayTeam?.name || g.away || 'Adversário',
    date: g.fixture?.date || g.utcDate || g.date || '',
    status: g.fixture?.status?.long || g.status || 'Agendado',
    homeScore: g.goals?.home ?? g.score?.fullTime?.home ?? null,
    awayScore: g.goals?.away ?? g.score?.fullTime?.away ?? null,
    updatedAt: new Date().toISOString()
  }));
  const batch=db.batch();
  games.forEach(game=>batch.set(db.collection('games').doc(game.id),game,{merge:true}));
  await batch.commit();
  console.log(`Jogos do Brasil atualizados: ${games.length}`);
}
main().catch(e=>{console.error(e);process.exit(1)});
