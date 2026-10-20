#!/usr/bin/env python3
"""Moderazione manuale della Bacheca: pubblica solo pseudonimi e testi."""
import datetime as dt
import json
import os
from pathlib import Path
import re
import secrets
import sys

ROOT = Path("bacheca/annunci.json")
NOW = dt.datetime.now(dt.timezone.utc)
KINDS = {"VENDO", "COMPRO", "CERCO", "REGALO", "SCAMBIO"}
CATEGORIES = {"Casa e arredi", "Abbigliamento", "Elettronica", "Libri e hobby", "Regalo e scambio", "Cerco"}

def field(name, limit):
    v = " ".join(os.environ.get(name, "").strip().split())
    if len(v) > limit:
        raise ValueError(name + ": campo troppo lungo (" + str(limit) + " caratteri massimo)")
    return v

def valid_public_text(text):
    if re.search(r"(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d)|(?:https?://|www\.|wa\.me/))", text, re.IGNORECASE):
        raise ValueError("Il campo contiene un possibile recapito o link: rimuovilo prima di approvare.")
    if any(ord(c) < 32 for c in text):
        raise ValueError("Caratteri di controllo non ammessi.")
    return text

def main():
    operation = field("BC_OPERATION", 20)
    doc = json.loads(ROOT.read_text(encoding="utf-8"))
    ads = doc.get("ads", [])
    if not isinstance(ads, list):
        raise ValueError("Formato annunci.json non valido")
    if operation == "approva":
        nick = valid_public_text(field("BC_NICK", 30))
        kind = field("BC_KIND", 30)
        category = field("BC_CATEGORY", 65)
        description = valid_public_text(field("BC_TEXT", 200))
        price = valid_public_text(field("BC_PRICE", 40))
        if not (nick and description):
            raise ValueError("Pseudonimo e descrizione obbligatori")
        if kind not in KINDS or category not in CATEGORIES:
            raise ValueError("Categoria o tipo non valido")
        code = "BC-" + NOW.strftime("%y%m%d") + "-" + secrets.token_hex(3).upper()
        ads.insert(0, {
            "id": code, "type": kind, "text": description,
            "price": price or "da concordare", "cat": category, "nick": nick,
            "approvedAt": NOW.isoformat(timespec="seconds"),
            "expiresAt": (NOW + dt.timedelta(days=30)).isoformat(timespec="seconds")
        })
        print("Annuncio approvato:", code)
    elif operation == "rimuovi":
        code = field("BC_CODE", 32).upper()
        if not code:
            raise ValueError("Inserisci il codice dell'annuncio da rimuovere")
        before = len(ads)
        ads = [ad for ad in ads if str(ad.get("id", "")).upper() != code]
        if len(ads) == before:
            raise ValueError("Codice annuncio non presente: " + code)
        print("Rimosso:", code)
    else:
        raise ValueError("Operazione non valida: " + operation)
    doc["version"] = 1
    doc["updatedAt"] = NOW.date().isoformat()
    doc["ads"] = ads
    ROOT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as e:
        print("ERRORE MODERAZIONE:", e, file=sys.stderr)
        sys.exit(1)
