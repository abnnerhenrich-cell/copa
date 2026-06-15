# Bolão Brasil 2026 - versão corrigida

Esta versão tem os botões corrigidos e funciona em dois modos:

1. **Modo teste local**: funciona mesmo sem Firebase configurado. Os dados ficam salvos no celular/computador usado.
2. **Modo online Firebase**: login real, palpites de todos, ranking e admin sincronizados para todos.

## Para testar agora

Abra `index.html` ou publique na Vercel. Se o Firebase ainda estiver como `COLE_AQUI`, entre pelo botão **Entrar e testar**. Os botões de menu, palpites, admin, atualizar resultado e limpar ranking já funcionam.

## Admin

PIN padrão: `2026`

Troque no arquivo:

```js
firebase-config.js
export const ADMIN_PIN = "2026";
```

## Para funcionar online para todos

1. Crie projeto no Firebase.
2. Ative Authentication > Email/password.
3. Ative Firestore Database.
4. Copie a configuração Web do Firebase.
5. Cole no arquivo `firebase-config.js`.
6. Envie para o GitHub.
7. Publique na Vercel.

## Como colocar os jogos do Brasil

Entre no site como admin, use **Enviar jogos JSON** e envie a lista. Também pode deixar o GitHub Actions atualizar automaticamente depois que configurar os secrets.

## Limpar histórico de ranking

Admin > Limpar histórico de ranking. Isso apaga todos os palpites e zera o ranking.
