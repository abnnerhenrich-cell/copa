# Bolão Seleção Brasileira 2026 — Premium Plus

Feito com base nas imagens de referência: visual mobile escuro, cards grandes, menu inferior, drawer lateral, ranking, estatísticas, tutorial e painel admin.

## O que funciona sem configurar nada
- Login por nome + WhatsApp
- Apenas jogos da Seleção Brasileira
- Salvar e editar palpites
- Ranking automático quando o admin lança resultado
- Estatísticas do jogador
- Admin por PIN: `2026`
- Ver todos os palpites
- Lançar resultado
- Limpar ranking/palpites
- Exportar palpites
- Restaurar jogos
- PWA instalável no celular

## Como colocar no GitHub
1. Extraia este ZIP.
2. Crie um repositório no GitHub.
3. Envie todos os arquivos.
4. Na Vercel, importe o repositório e clique em Deploy.

## Automação real gratuita
Este pacote já deixa o site pronto para receber jogos por JSON. Para atualizar automaticamente de graça:

1. Crie um arquivo `data/brasil-jogos.json` no repositório ou use Firebase.
2. Configure um GitHub Action para atualizar esse JSON com uma API gratuita de futebol.
3. Para placar realmente simultâneo, uma API com dados ao vivo é necessária. No gratuito, o ideal é atualizar a cada 5 ou 10 minutos.

## Observação importante
Sem API externa ou Firebase conectado, nenhum site consegue buscar placares reais sozinho. A versão local funciona 100% para bolão manual/semi-automático e está preparada para automação.
