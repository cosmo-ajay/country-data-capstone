"""Scrape the source page and save the first 20 countries to SQLite."""

from database import CountryDatabaseManager
from scraper import COUNTRY_LIMIT, scrape_countries


def main() -> None:
    countries = scrape_countries(limit=COUNTRY_LIMIT)
    database = CountryDatabaseManager()
    for country in countries:
        database.upsert_country(country)
    print(f"Saved {len(countries)} countries to {database.db_path}")


if __name__ == "__main__":
    main()
