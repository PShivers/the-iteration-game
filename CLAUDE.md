# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Iteration Review Card Game

### What This Is

A print-and-play card game for SAFe Agile teams, inspired by The Metagame (Local No. 12, 2015). Used during iteration reviews, retros, or PI planning to spark discussion.

### Card Types

- **Opinion Cards** (pink): Discussion prompts like "Which delivered the most value?" or "Which would you demo to the CEO?"
- **Culture Cards** (white): Agile concepts/artifacts (e.g. Technical Debt, Daily Standup) with short witty descriptions

### How to Generate Cards

Run `generate_cards.py` to produce `iteration_review_cards.pdf`. Uses Python reportlab. Cards are laid out 3×3 per page on US Letter.

```bash
pip install reportlab
python generate_cards.py
```

Note: `generate_cards.py` does not yet exist and needs to be created.

### Style Guidelines

- Opinion cards: Short, punchy questions in ALL CAPS. Keep to 2-5 words per line. One fill-in-the-blank card per set is fine.
- Culture cards: Title in ALL CAPS + a 2-4 line snarky/humorous description. Reference real agile practices, tools, or ceremonies.
- Tone: Irreverent but recognizable to anyone who's worked on an agile team. Think "office humor" not "textbook."
- Keep card count balanced: equal numbers of opinion and culture cards.

## Key Files

- `TheMetagame_BasicSet_PnP.pdf` — Original Metagame for reference (card format, layout, tone)
- `iteration_review_cards.pdf` — Generated output
- `generate_cards.py` — Card generation script

## When Adding New Cards

Add entries to the `opinion_cards` or `culture_cards` lists in `generate_cards.py` and re-run. The script auto-paginates (9 cards per page).
