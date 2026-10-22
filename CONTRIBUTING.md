# How we work together

1. **Pick an issue** from the GitHub Projects board and move it to "Doing".
2. **Make your own branch** off `main`: `git checkout -b firmware/wifi-post`
   (start the name with `firmware/`, `web/`, `backend/`, `logic/` or `docs/`).
3. **Commit small and often**, with a message that says what you did: `Add forecast function`.
4. **Open a pull request** into `main`. Louie reviews it. Tell us what you changed and how to test it.
5. **Pull `main` often** so your branch doesn't fall behind: `git pull origin main`.

Ground rules:
- `main` should always run. **Don't push straight to it.**
- Don't change `docs/API_CONTRACT.md` or `backend/schema.sql` without telling Louie first.
- Stay in your own folder when you can. If you need to touch someone else's files, give them a heads up first.
- Never commit secrets (`.env`, tokens, WiFi passwords).
- If you've been stuck for about an hour, ask in the group chat. Nobody minds.
- We only have about 6 weeks, so don't sit on your task until the last week.
