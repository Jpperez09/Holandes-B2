# Welcome — Let's Get You Learning Dutch 🇳🇱

This is a friendly, step-by-step guide for setting up the Dutch learning app on your
own computer. **You do not need to be technical.** Just follow each step in order.

Take your time. If something looks different from what's described here, that's okay —
read the **"If something goes wrong"** section at the bottom.

---

## Step 1 — Install Node (one time only)

Node is the small program that runs the app. You only install it once.

1. Go to **https://nodejs.org**
2. Download the version that says **"LTS"** (it should say version **22**).
3. Open the downloaded file and click **Next / Install** until it finishes.

That's it. You won't need to open Node yourself — the app uses it for you.

## Step 2 — Get the app onto your computer

You need the app's files. If you were given a link to download a ZIP, unzip it to a
folder you'll remember (for example, your Documents folder).

If you are comfortable with Git instead:

```
git clone https://github.com/Jpperez09/Holandes-B2.git
```

Either way, you should end up with a folder called **Holandes-B2**.

## Step 3 — Open a terminal in that folder

A "terminal" is a window where you type commands.

- **Windows:** open the `Holandes-B2` folder, click the address bar at the top,
  type `cmd`, and press **Enter**.
- **Mac:** open the `Holandes-B2` folder, right-click it, and choose
  **"New Terminal at Folder"**.

A black or white window opens. This is the terminal.

## Step 4 — Install the app's parts (one time only)

In the terminal window, type this exactly and press **Enter**:

```
npm run install:all
```

This downloads everything the app needs. It can take **2–5 minutes**. You'll see lots
of text scroll by — that's normal. Wait until it stops and you can type again.

## Step 5 — Start the app

In the same terminal, type this and press **Enter**:

```
npm run dev
```

After a few seconds you'll see messages saying the app is running. **Leave this
terminal window open** — closing it stops the app.

## Step 6 — Open the app in your browser

Open your web browser (Chrome, Edge, Firefox…) and go to:

```
http://localhost:5173
```

You should see the **Home** screen with a friendly greeting. 🎉

## Step 7 — Connect your Dutch lessons

The app needs to know where the Dutch lesson folder (the "vault") is on your computer.

1. In the app, click **Settings** in the left menu.
2. Click **"For technical users"** to expand it.
3. In the **Vault folder path** box, paste the full path to your Dutch vault folder
   (someone will have shared this folder with you — for example
   `C:\Users\YourName\Documents\Juanpa-Holandes-B2`).
4. Click **Save vault folder**.

The app will scan your lessons. After a moment, the modules appear.

> If the app already shows your modules, this step was done for you — skip it.

## Step 8 — Start your first lesson

1. Click **Learn** in the left menu.
2. Click the first module, **MOD-001 — First Contact**.
3. Read each section and do the small activities.
4. As you finish each activity, click **Mark done** so it gets a green check.

## Step 9 — Do your daily vocabulary review

1. Click **Review** in the left menu.
2. Click **Start review**.
3. A Dutch word appears. Try to remember what it means.
4. Click **🔊** to hear it spoken aloud.
5. Click **Show answer**.
6. Tell the app how it felt: **Again**, **Hard**, **Good**, or **Easy**.
7. The next word appears. Keep going until it says you're done.

Doing this **every day**, even for five minutes, is the single best habit. 💪

## Step 10 — Write your daily log

1. Click **Today** in the left menu.
2. Scroll to step 5, **"Write today's log"**, and click **Write**.
3. Write a sentence or two about how studying felt today.
4. Click **Save log**.

## Step 11 — Stopping and restarting the app

**To stop:** click the terminal window and press **Ctrl + C** (hold Ctrl, press C).
You can also just close the terminal window.

**To start again later:**

1. Open a terminal in the `Holandes-B2` folder again (Step 3).
2. Type `npm run dev` and press **Enter**.
3. Open `http://localhost:5173` in your browser.

You do **not** need to repeat Steps 1 or 4 — those were one-time setup.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| "Can't reach the app" in the browser | The app isn't running. Go back to the terminal and run `npm run dev` again. |
| "Your Dutch content is not connected" | Do Step 7 — set your vault folder path in Settings. |
| `'npm' is not recognized` in the terminal | Node didn't install correctly. Repeat Step 1, then restart your computer. |
| The page won't open at `localhost:5173` | Make sure the terminal still shows the app running, and that you typed the address exactly. |
| The vocabulary audio is silent | The app uses your computer's voices. It still works without sound — this is optional. |
| Something else | Close everything, restart your computer, and try Steps 5–6 again. |

---

## A few friendly reminders

- **Your progress is private.** Everything stays on your computer. Nothing is uploaded.
- **Little and often wins.** Five honest minutes a day beats one long cram session.
- **Mistakes are good.** Getting a word wrong in review is how it gets remembered.
- **You can't break it.** If you get stuck, stopping and restarting the app is safe.

Veel succes! (Good luck!) 🎉
