#!/usr/bin/env python3
"""Generate iteration_review_cards.pdf — print-and-play card game for SAFe Agile teams."""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

PAGE_W, PAGE_H = LETTER
MARGIN = 0.5 * inch
COLS, ROWS = 3, 3
CARDS_PER_PAGE = COLS * ROWS
CARD_W = (PAGE_W - 2 * MARGIN) / COLS
CARD_H = (PAGE_H - 2 * MARGIN) / ROWS
PAD = 10

PINK        = colors.HexColor('#F4A7B9')
DARK_RED    = colors.HexColor('#8B1A2E')
NEAR_BLACK  = colors.HexColor('#1A1A1A')
MID_GRAY    = colors.HexColor('#555555')
LIGHT_GRAY  = colors.HexColor('#CCCCCC')

opinion_cards = [
    "WHICH DELIVERED\nTHE MOST VALUE?",
    "WHICH WOULD YOU\nDEMO TO THE CEO?",
    "WHICH WOULD YOU\nCUT FIRST?",
    "WHICH SHOULD HAVE\nBEEN AN EMAIL?",
    "WHICH ESTIMATE\nWAS MOST WRONG?",
    "WHICH TOOK THE MOST\nMEETINGS TO SHIP?",
    "WHICH IS MOST LIKELY\nTO PAGE YOU AT 2AM?",
    "WHICH WOULD YOU\nHAND OFF TO\n___________?",
    "WHICH WOULD YOU\nDO AGAIN\nNEXT SPRINT?",
]

culture_cards = [
    (
        "TECHNICAL DEBT",
        "The mortgage on your\ncodebase. You know you\nshould pay it down. You won't.",
    ),
    (
        "DAILY STANDUP",
        "Fifteen minutes of everyone\nsaying they're not blocked\nwhile being very blocked.",
    ),
    (
        "VELOCITY",
        "A number that goes up\nwhen things go well and gets\nblamed when they don't.",
    ),
    (
        "DEFINITION OF DONE",
        "The checklist you agreed on\nin planning and quietly\nignore by Thursday.",
    ),
    (
        "STORY POINTS",
        "A unit of effort that means\nnothing and everything\nat the same time.",
    ),
    (
        "RETROSPECTIVE",
        "Where the team agrees to fix\nthe same three problems\nit agreed to fix last sprint.",
    ),
    (
        "PRODUCT BACKLOG",
        "A graveyard of good ideas,\northogonal priorities,\nand stakeholder whims. RIP.",
    ),
    (
        "SPRINT GOAL",
        "Written optimistically\non Monday.\nAbandoned by Wednesday.",
    ),
    (
        "PI PLANNING",
        "Two days of sticky notes,\nsnacks, and collective\ndelusion at scale.",
    ),
]


def _centered_text_y(card_bottom, card_height, n_lines, line_h, font_size):
    """Return y of the first (top) baseline so n_lines are vertically centered."""
    return card_bottom + card_height / 2 + (n_lines - 1) * line_h / 2


def draw_opinion_card(c, x, y, text):
    # Background + border
    c.setFillColor(PINK)
    c.setStrokeColor(NEAR_BLACK)
    c.setLineWidth(0.75)
    c.rect(x, y, CARD_W, CARD_H, fill=1, stroke=1)

    # "OPINION" type label
    c.setFillColor(DARK_RED)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H - PAD - 6, "OPINION")

    # Main question
    lines = text.split('\n')
    font_size = 13
    line_h = font_size * 1.55
    start_y = _centered_text_y(y, CARD_H, len(lines), line_h, font_size)
    c.setFillColor(DARK_RED)
    c.setFont("Helvetica-Bold", font_size)
    for i, line in enumerate(lines):
        c.drawCentredString(x + CARD_W / 2, start_y - i * line_h, line)


def draw_culture_card(c, x, y, title, description):
    # Background + border
    c.setFillColor(colors.white)
    c.setStrokeColor(NEAR_BLACK)
    c.setLineWidth(0.75)
    c.rect(x, y, CARD_W, CARD_H, fill=1, stroke=1)

    # "CULTURE" type label
    c.setFillColor(MID_GRAY)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H - PAD - 6, "CULTURE")

    # Title
    c.setFillColor(NEAR_BLACK)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H - PAD - 22, title)

    # Divider
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.5)
    divider_y = y + CARD_H - PAD - 30
    c.line(x + PAD * 2, divider_y, x + CARD_W - PAD * 2, divider_y)

    # Description — centered in the space below the divider
    lines = description.split('\n')
    font_size = 9.5
    line_h = font_size * 1.6
    # Center in the lower region (from card bottom to divider)
    region_center_y = y + divider_y / 2 - y / 2  # midpoint of [y, divider_y]
    start_y = region_center_y + (len(lines) - 1) * line_h / 2
    c.setFillColor(MID_GRAY)
    c.setFont("Helvetica-Oblique", font_size)
    for i, line in enumerate(lines):
        c.drawCentredString(x + CARD_W / 2, start_y - i * line_h, line)


def card_xy(index_on_page):
    """Return (x, y) bottom-left corner for the nth card on the current page."""
    col = index_on_page % COLS
    row = index_on_page // COLS
    x = MARGIN + col * CARD_W
    y = PAGE_H - MARGIN - (row + 1) * CARD_H
    return x, y


def generate_pdf(output='iteration_review_cards.pdf'):
    assert len(opinion_cards) == len(culture_cards), \
        f"Card counts must match: {len(opinion_cards)} opinion vs {len(culture_cards)} culture"

    c = canvas.Canvas(output, pagesize=LETTER)

    # Page(s): opinion cards
    for i, text in enumerate(opinion_cards):
        if i > 0 and i % CARDS_PER_PAGE == 0:
            c.showPage()
        draw_opinion_card(c, *card_xy(i % CARDS_PER_PAGE), text)

    # Page(s): culture cards
    c.showPage()
    for i, (title, desc) in enumerate(culture_cards):
        if i > 0 and i % CARDS_PER_PAGE == 0:
            c.showPage()
        draw_culture_card(c, *card_xy(i % CARDS_PER_PAGE), title, desc)

    c.save()
    total = len(opinion_cards) + len(culture_cards)
    print(f"Generated {output}: {total} cards ({len(opinion_cards)} opinion + {len(culture_cards)} culture)")


if __name__ == '__main__':
    generate_pdf()
