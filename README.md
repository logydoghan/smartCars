# SmartCars

Critics test-drive it. Owners live with it. See where they disagree.

Each car gets one page that sets three sources side by side: professional reviews (Car and Driver, MotorTrend, Edmunds, Consumer Reports and others), the complaints owners file with the US National Highway Traffic Safety Administration (NHTSA), and NHTSA's recall record. An AI agent then points out where they disagree, such as a transmission critics call smooth that owners say shudders.

## How it fits together

```
agents/     Python. Runs every Monday (GitHub Actions, 06:00 UTC) and refreshes the cars that are due.
  cars      The list of cars the site covers. Add a line to add a car.
  nhtsa     Owner complaints and recalls from NHTSA's free public API
  critics   Claude searches and reads reviews on a fixed list of review sites (web search tool),
            then summarizes each in its own words. Links Claude never opened are dropped.
  owners    Claude groups the owner complaints into the problems reported most
  compare   Claude compares all three and writes the disagreements and a verdict
  store     Saves the car page to Postgres (Supabase)
web/        Next.js site (Vercel). Reads car pages from Supabase.
supabase/   Database schema.
```

The site and the agents share one Supabase Postgres database. The agents write with the database connection string; the site reads with the public anon key, which row-level security limits to read-only.

## Costs

Each car refresh costs roughly $0.30 of Claude usage (Claude Sonnet 5.5), most of it reading reviews, plus up to five web searches at $10 per 1,000. The weekly run refreshes up to six cars whose pages are over 28 days old, so covering the starting 24 cars costs about $7 to fill and then about $8 a month. NHTSA data is free. Supabase and Vercel run on their free tiers.

## Setup

1. **Database.** Create a Supabase project and run `supabase/migrations/0001_init.sql` in its SQL editor.
2. **Agents.** In the GitHub repository, add two Actions secrets:
   - `ANTHROPIC_API_KEY`: a Claude API key (prepaid credits from console.anthropic.com).
   - `DATABASE_URL`: the Supabase **Session pooler** connection string from the dashboard's **Connect** dialog (`...pooler.supabase.com:5432/postgres`). GitHub Actions has no IPv6, and the direct host is IPv6-only.

   Then run **Weekly car refresh** by hand from the Actions tab. It fills six cars per run; run it a few times to fill the rest, or let the Monday schedule catch up. To refresh one car, enter its slug (for example `2024-toyota-rav4`) when running it by hand.
3. **Website.** Import the repository into Vercel with `web` as the root directory, and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the publishable key, `sb_publishable_...`). Without them the site shows built-in sample cars, which are made up.

## Running locally

```bash
# Agents
cd agents
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
export ANTHROPIC_API_KEY=...
caragent --no-db --json cars.json --car 2024-honda-cr-v   # dry run for one car

# Website
cd web
npm install
npm run dev     # http://localhost:3000, sample cars unless .env.local is set
```

Agent settings are environment variables, listed in `agents/.env.example`: the Claude model, cars per run, how old a page gets before a refresh, and how many searches and page reads Claude may use per car.

## Notes

- Cars default to model year 2024, so owners have had a year to report problems. Change the year in `agents/caragent/cars.py` once newer cars have owner history. If NHTSA spells a model differently from the badge, set `nhtsa_model` on that line.
- The review sites Claude may read are in `REVIEW_SITES` in `agents/caragent/critics.py`. Some sites block automated reading or sit behind a paywall (Consumer Reports), so a car may show fewer reviews than outlets.
- Reviews are summarized in the agent's own words and always link to the original; nothing is copied.
- NHTSA complaints are reported by owners, not verified, and not adjusted for how many cars were sold. The site says so on every page.
- The web code started from the SmartNews site (same stack and look); reader accounts were left out of this first version.
