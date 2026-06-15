# Bolão Seleção Brasileira - Premium Plus

Funciona localmente sem Firebase e fica automático quando você configurar Firebase + GitHub Actions.

## Login
- Usuário entra com Nome + WhatsApp.
- Admin é só você, pelo PIN padrão `2026`.
- Para trocar o PIN, edite `ADMIN_PIN` no arquivo `app.js`.

## Automático
Para atualizar sozinho:
1. Crie projeto no Firebase.
2. Ative Firestore.
3. Cole a config Web em `firebase-config.js`.
4. Gere chave privada em Firebase > Configurações > Contas de serviço.
5. No GitHub, crie os Secrets:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   - FOOTBALL_API_URL
   - FOOTBALL_API_KEY, se sua API exigir.
6. Vá em Actions > Atualizar jogos do Brasil > Run workflow.

O script filtra somente Brazil/Brasil/BRA.

## Hospedagem
Suba no GitHub e importe na Vercel.
