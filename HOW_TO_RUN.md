# How to Run the CCA Demo

Follow these steps in order. Each one goes in the VS Code terminal.

---

## Before You Start

Open VS Code, then open the terminal:
**Menu → Terminal → New Terminal**

The terminal should show:
```
PS E:\word docs\Claude\CCA Test>
```
If it does not, something is wrong before you even begin — stop and fix that first.

---

## Step 1 — Confirm Node is installed

Type this and press Enter:
```
node --version
```
**You should see:** `v24.x.x` or similar

If you see an error, Node.js is not installed. Go to https://nodejs.org, download the LTS version, run the installer, restart VS Code, and try again.

---

## Step 2 — Confirm your API key is in place

Open the file `.env.local` in this folder. It should look like this:
```
ANTHROPIC_API_KEY=sk-ant-...your key here...
```
If the file is missing or the key is blank, the grader will not work.

---

## Step 3 — Install dependencies (first time only)

Type this and press Enter:
```
npm install
```
**You should see:** `added XX packages` when it finishes.

You only need to do this once. If you have run it before, skip to Step 4.

---

## Step 4 — Start the app

Type this and press Enter:
```
npm run dev
```
**You should see:**
```
ready started server on http://localhost:3000
```
The terminal will appear to hang — that is normal. The server is running.

---

## Step 5 — Open the app in your browser

Open Chrome or Edge and go to:
```
http://localhost:3000
```
The CCA demo should appear.

---

## Step 6 — When you are done

Go back to the terminal and press **Ctrl+C** to stop the server.

---

## If Something Goes Wrong

| Problem | Fix |
|---|---|
| `node` not recognized | Reinstall Node.js from nodejs.org, restart VS Code |
| `npm` not recognized | Same as above |
| Scripts disabled error | Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` then retry |
| localhost refused to connect | You forgot Step 4 — run `npm run dev` first |
| Grading fails / no result | Check that `.env.local` has your API key |
| Terminal shows `>>` | Press Ctrl+C to get back to the normal prompt |
