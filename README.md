# Country Data Pipeline & Analytics

A capstone project that scrapes the first 20 countries from [Scrape This Site](https://www.scrapethissite.com/pages/simple/), stores them in SQLite, serves them through FastAPI, exports the API response to CSV, and creates a population-versus-area scatter plot.

## Project files

- `scraper.py` — fetches and parses country names, capitals, populations, and areas.
- `scrape_to_db.py` — scrapes the first 20 country cards and inserts or refreshes them in SQLite.
- `database.py` — `CountryDatabaseManager` and its SQLite CRUD operations. Country name is the primary key.
- `api.py` — FastAPI service with list, read, create, update, and delete endpoints.
- `client.py` — requests the API, prints a Pandas DataFrame, and writes `exported_countries.csv`.
- `visualize.py` — reads the CSV and writes `population_vs_area.png`.
- `requirements.txt` — Python dependencies.

The SQLite database is created as `countries.db` in this folder the first time the database manager is initialized. Set `COUNTRIES_DB_PATH` to use another location.

## Dashboard

Start the API and open `http://127.0.0.1:8000/` for the country dashboard. It supports searching, adding, editing, and deleting records. The API reference remains at `http://127.0.0.1:8000/docs`.

## Setup

Python 3.10 or newer is recommended. From this folder, create and activate a virtual environment.

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Run the pipeline

1. Scrape and save the first 20 countries:

   ```bash
   python scrape_to_db.py
   ```

2. Start the API from this folder and leave it running:

   ```bash
   uvicorn api:app --reload
   ```

   Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

3. In a second terminal with the virtual environment activated, fetch the records and export the CSV:

   ```bash
   python client.py
   ```

4. Generate the scatter plot:

   ```bash
   python visualize.py
   ```

The CSV and PNG are written beside the Python files.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/countries` | Retrieve all stored countries. |
| `GET` | `/countries/{country_name}` | Retrieve one country by name. |
| `POST` | `/countries` | Create a country. The JSON body contains `country_name`, `capital`, `population`, and `area_sq_km`. |
| `PUT` | `/countries/{country_name}` | Update `capital`, `population`, and `area_sq_km` for an existing country. |
| `DELETE` | `/countries/{country_name}` | Delete a country by name. |

Missing records return `404`; creating a duplicate country name returns `409`.
