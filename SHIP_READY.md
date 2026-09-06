# ship-ready

This repository carries the **s00011-pdftool** app (a client-side PDF merge /
split workspace) on top of the shared baseline:

- **`README.md`** — what the app is, and the green-field local run steps (no
  database, migration, seed, or dummy account is involved).
- **`AGENTS.md`** — the run/deploy contract every app here follows (coding agents read this first).
- **`conventions/`** — per-topic guides the contract routes you to (stacks, datastores, env, networking, deployment, and a `preview.toml` escape hatch).

The contract keeps the app easy to **run locally** and **ship as a single container** out of the box, without constraining how you design or test your code. Keep it satisfied as the app grows: read `README.md` for how it is satisfied today.
