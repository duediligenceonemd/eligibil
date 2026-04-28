# Grants Inbox

Drop email exports (`.eml`), text files (`.txt`), or markdown (`.md`) here.

Run `npm run grants:process` to:
1. Extract structured grant data via Claude API
2. Calculate relevance score (0-100)
3. Insert into Supabase `grants_staging` table
4. Write Obsidian draft note to `~/eligibil-grants/drafts/`
5. Auto-approve if score ≥ 85
6. Move processed file to `inbox/processed/`

Failed extractions go to `inbox/failed/` for manual review.

## How to export emails from Gmail

1. Open the email in Gmail
2. Click **⋮** (three dots) → **Download message**
3. Save the `.eml` file to this folder
4. Run `npm run grants:process`

## Or paste manually

Open `http://localhost:3000/admin-queue.html` and click **"Paste new grant"**.
