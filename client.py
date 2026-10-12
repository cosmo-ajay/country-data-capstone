"""Fetch country records from the API and export them to CSV."""

from pathlib import Path

import pandas as pd
import requests


API_URL = "http://127.0.0.1:8000/countries"
CSV_PATH = Path(__file__).resolve().parent / "exported_countries.csv"
CSV_COLUMNS = ["country_name", "capital", "population", "area_sq_km"]


def main() -> None:
    try:
        response = requests.get(API_URL, timeout=30)
        response.raise_for_status()
    except requests.RequestException as error:
        raise SystemExit(
            f"Could not reach {API_URL}. Start the API with "
            "'uvicorn api:app --reload' and try again.\n"
            f"Details: {error}"
        ) from error

    dataframe = pd.DataFrame(response.json(), columns=CSV_COLUMNS)
    print(dataframe.to_string(index=False))
    dataframe.to_csv(CSV_PATH, index=False)
    print(f"\nExported {len(dataframe)} countries to {CSV_PATH}")


if __name__ == "__main__":
    main()
