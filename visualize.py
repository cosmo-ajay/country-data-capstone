"""Create a population-versus-area scatter plot from the exported CSV."""

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "exported_countries.csv"
PLOT_PATH = BASE_DIR / "population_vs_area.png"


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(
            f"{CSV_PATH.name} was not found. Run 'python client.py' first."
        )

    dataframe = pd.read_csv(CSV_PATH)
    required_columns = {"country_name", "population", "area_sq_km"}
    missing_columns = required_columns.difference(dataframe.columns)
    if missing_columns:
        raise SystemExit(
            "CSV is missing required columns: " + ", ".join(sorted(missing_columns))
        )

    figure, axis = plt.subplots(figsize=(10, 6))
    axis.scatter(dataframe["population"], dataframe["area_sq_km"], alpha=0.8)
    axis.set_title("Country Population vs. Area")
    axis.set_xlabel("Population")
    axis.set_ylabel("Area (sq. km)")
    axis.grid(True, linestyle="--", alpha=0.5)
    figure.tight_layout()
    figure.savefig(PLOT_PATH, dpi=150)
    plt.close(figure)
    print(f"Saved scatter plot to {PLOT_PATH}")


if __name__ == "__main__":
    main()
