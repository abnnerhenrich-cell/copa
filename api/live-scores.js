export default async function handler(req,res){
  // Para placar real, conecte uma API de futebol aqui e retorne: {games:[{id:'g0',status:'Encerrado',score:[2,0]}]}
  // Este retorno deixa o site funcionando sem chave externa e permite atualização automática a cada 60s.
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({updatedAt:new Date().toISOString(),games:[]});
}
