# Bolão Brasil 2026 Automático

Site pronto para GitHub + Vercel + Firebase.

## O que já vem pronto

- Tema azul responsivo para celular
- Login com Firebase Authentication
- Jogos somente do Brasil
- Palpites salvos no Firestore
- Ranking automático
- Atualização em tempo real no site
- GitHub Actions para atualizar resultados automaticamente
- PWA para instalar no celular

## Importante

Para resultado simultâneo de verdade você precisa de uma fonte de placar. O projeto já está pronto para usar API-Football com plano grátis. Sem chave de API, o GitHub Actions apenas envia/atualiza os jogos do arquivo `data/jogos-brasil.json`.

## Passo 1 — Firebase

1. Acesse https://console.firebase.google.com
2. Crie um projeto
3. Vá em Authentication > Sign-in method
4. Ative Email/Password
5. Vá em Firestore Database
6. Crie o banco em modo produção ou teste
7. Em Regras, use inicialmente:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /bets/{betId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Passo 2 — Configurar o site

1. No Firebase, clique na engrenagem > Configurações do projeto
2. Desça em Seus apps
3. Crie um app Web
4. Copie a configuração firebaseConfig
5. Cole no arquivo `firebase-config.js`

## Passo 3 — GitHub

1. Crie um repositório novo no GitHub
2. Envie todos os arquivos deste projeto
3. Vá em Settings > Secrets and variables > Actions
4. Crie o secret `FIREBASE_SERVICE_ACCOUNT`

Para pegar o valor:

1. Firebase Console > Configurações do projeto
2. Contas de serviço
3. Gerar nova chave privada
4. Abra o JSON baixado
5. Copie todo o conteúdo
6. Cole no secret `FIREBASE_SERVICE_ACCOUNT`

## Passo 4 — API grátis de resultados

1. Crie uma conta na API-Football/API-Sports
2. Pegue sua chave grátis
3. No GitHub, crie o secret:

```txt
API_FOOTBALL_KEY
```

Opcionalmente crie também:

```txt
API_FOOTBALL_BRAZIL_TEAM_ID
API_FOOTBALL_LEAGUE_ID
```

Caso a API retorne 0 jogos, ajuste esses IDs conforme a própria API.

## Passo 5 — Rodar a primeira atualização

1. No GitHub, vá em Actions
2. Clique em Atualizar resultados do Brasil
3. Clique em Run workflow
4. Aguarde concluir
5. Confira se a coleção `games` apareceu no Firestore

## Passo 6 — Vercel

1. Acesse https://vercel.com
2. Add New Project
3. Escolha seu repositório
4. Framework: Other
5. Deploy

Pronto. O site fica online e atualiza sozinho pelo Firebase.

## Como funciona a atualização

- GitHub Actions roda a cada 10 minutos
- Busca resultados pela API
- Salva no Firestore
- O site escuta o Firestore em tempo real
- Quando o resultado muda, todos os celulares atualizam automaticamente

## Para atualizar só manualmente

Edite `data/jogos-brasil.json`, depois rode Actions > Run workflow.
