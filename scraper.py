"""Scrape the first 20 country cards from the project source page."""

from __future__ import annotations

import re

import requests
from bs4 import BeautifulSoup


SOURCE_URL = "https://www.scrapethissite.com/pages/simple/"
COUNTRY_LIMIT = 20


def _text(card: BeautifulSoup, selector: str, field_name: str) -> str:
    element = card.select_one(selector)
    if element is None:
        raise ValueError(f"Could not find {field_name} in a country card.")
    value = element.get_text(" ", strip=True)
    if not value:
        raise ValueError(f"The {field_name} field is empty in a country card.")
    return value


def scrape_countries(limit: int = COUNTRY_LIMIT) -> list[dict]:
    """Fetch and parse up to ``limit`` country records from the source page."""
    if limit < 1:
        raise ValueError("limit must be at least 1")

    response = requests.get(
        SOURCE_URL,
        headers={"User-Agent": "CountryDataCapstone/1.0 (educational project)"},
        timeout=30,
    )
    response.raise_for_status()
    # Pass response bytes so BeautifulSoup can honor the page's declared
    # encoding instead of relying on requests' less reliable text fallback.
    soup = BeautifulSoup(response.content, "html.parser")
    cards = soup.select("div.country")[:limit]
    if not cards:
        raise ValueError("No country cards were found on the source page.")

    countries = []
    for card in cards:
        country_name = _text(card, ".country-name", "country name")
        capital = _text(card, ".country-capital", "capital")
        population_text = _text(card, ".country-population", "population")
        area_text = _text(card, ".country-area", "area")

        try:
            population = int(re.sub(r"[^0-9]", "", population_text))
            area_sq_km = float(area_text.replace(",", ""))
        except ValueError as error:
            raise ValueError(
                f"Invalid numeric data for country {country_name!r}."
            ) from error

        countries.append(
            {
                "country_name": country_name,
                "capital": capital,
                "population": population,
                "area_sq_km": area_sq_km,
            }
        )

    return countries
