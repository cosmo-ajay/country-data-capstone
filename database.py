"""SQLite storage and CRUD operations for country records."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "countries.db"


class CountryDatabaseManager:
    """Manage country records in SQLite, keyed by their country name."""

    def __init__(self, db_path: str | Path | None = None) -> None:
        configured_path = db_path or os.getenv("COUNTRIES_DB_PATH") or DEFAULT_DB_PATH
        self.db_path = Path(configured_path).expanduser().resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize_database()

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize_database(self) -> None:
        """Create the countries table if it does not exist yet."""
        with self._connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS countries (
                    country_name TEXT PRIMARY KEY,
                    capital TEXT NOT NULL,
                    population INTEGER NOT NULL CHECK (population >= 0),
                    area_sq_km REAL NOT NULL CHECK (area_sq_km >= 0)
                )
                """
            )

    @staticmethod
    def _as_dict(row: sqlite3.Row | None) -> dict | None:
        return dict(row) if row is not None else None

    def create_country(self, country: dict) -> dict:
        """Insert a country; raise ``sqlite3.IntegrityError`` if it exists."""
        with self._connection() as connection:
            connection.execute(
                """INSERT INTO countries (country_name, capital, population, area_sq_km)
                   VALUES (?, ?, ?, ?)""",
                (
                    country["country_name"],
                    country["capital"],
                    country["population"],
                    country["area_sq_km"],
                ),
            )
        return country

    def get_all_countries(self) -> list[dict]:
        """Return all countries ordered by name."""
        with self._connection() as connection:
            rows = connection.execute(
                "SELECT country_name, capital, population, area_sq_km "
                "FROM countries ORDER BY country_name"
            ).fetchall()
        return [dict(row) for row in rows]

    def get_country(self, country_name: str) -> dict | None:
        """Return one country by its natural key, or ``None`` if absent."""
        with self._connection() as connection:
            row = connection.execute(
                "SELECT country_name, capital, population, area_sq_km "
                "FROM countries WHERE country_name = ?",
                (country_name,),
            ).fetchone()
        return self._as_dict(row)

    def update_country(self, country_name: str, country: dict) -> dict | None:
        """Replace a country's fields; return ``None`` if it does not exist."""
        with self._connection() as connection:
            cursor = connection.execute(
                """UPDATE countries
                   SET capital = ?, population = ?, area_sq_km = ?
                   WHERE country_name = ?""",
                (
                    country["capital"],
                    country["population"],
                    country["area_sq_km"],
                    country_name,
                ),
            )
        if cursor.rowcount == 0:
            return None
        return self.get_country(country_name)

    def delete_country(self, country_name: str) -> bool:
        """Delete a country and return whether a record was removed."""
        with self._connection() as connection:
            cursor = connection.execute(
                "DELETE FROM countries WHERE country_name = ?", (country_name,)
            )
        return cursor.rowcount > 0

    def upsert_country(self, country: dict) -> None:
        """Insert a scraped record or refresh the fields if its name exists."""
        with self._connection() as connection:
            connection.execute(
                """INSERT INTO countries (country_name, capital, population, area_sq_km)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(country_name) DO UPDATE SET
                       capital = excluded.capital,
                       population = excluded.population,
                       area_sq_km = excluded.area_sq_km""",
                (
                    country["country_name"],
                    country["capital"],
                    country["population"],
                    country["area_sq_km"],
                ),
            )
