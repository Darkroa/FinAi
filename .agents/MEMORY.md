- [FINAI MD](FINAI.md) — after large edith update the FINAI.md and add the brif here.
  
- [FINAI MD](FINAI.md) — main view is a card-based list; each row sets subPage state; SubPageWrapper adds back-button; no tab bar.
- [AI hub keymodel](FINAI.md) — `src/utils/keymodel.py` is the single source for all 8 AI providers; `llm.py` is a shim; all modules must import from keymodel.
- [BotsPage trade log split](FINAI.md) — FinBot trades filtered by excluding 'fineventai' in reason field; EventBot trades shown in separate FinEventAI Trade Log card at bottom.
- [trade_logs DB columns](FINAI.md) — Added is_event_bot BOOLEAN, take_profit FLOAT, stop_loss FLOAT via startup migrations in main.py.
