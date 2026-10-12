const API_URL = "/countries";
const numberFormat = new Intl.NumberFormat("en-US");
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const elements = {
  rows: document.querySelector("#country-rows"),
  totalCountries: document.querySelector("#total-countries"),
  totalPopulation: document.querySelector("#total-population"),
  totalArea: document.querySelector("#total-area"),
  tableCount: document.querySelector("#table-count"),
  search: document.querySelector("#search-input"),
  dialog: document.querySelector("#country-dialog"),
  form: document.querySelector("#country-form"),
  name: document.querySelector("#country-name"),
  capital: document.querySelector("#capital"),
  population: document.querySelector("#population"),
  area: document.querySelector("#area-sq-km"),
  title: document.querySelector("#dialog-title"),
  save: document.querySelector("#save-button"),
  error: document.querySelector("#form-error"),
  toast: document.querySelector("#toast"),
};

let countries = [];
let editingCountry = null;
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3200);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch (_) { /* Keep the status message for non-JSON errors. */ }
    throw new Error(Array.isArray(message) ? message.map((item) => item.msg).join("; ") : message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function renderStats() {
  const population = countries.reduce((sum, country) => sum + Number(country.population || 0), 0);
  const area = countries.reduce((sum, country) => sum + Number(country.area_sq_km || 0), 0);
  elements.totalCountries.textContent = numberFormat.format(countries.length);
  elements.totalPopulation.textContent = compactFormat.format(population);
  elements.totalArea.textContent = `${compactFormat.format(area)} km²`;
}

function renderTable() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const visibleCountries = countries.filter((country) =>
    `${country.country_name} ${country.capital}`.toLocaleLowerCase().includes(query),
  );

  elements.tableCount.textContent = query
    ? `Showing ${visibleCountries.length} of ${countries.length} countries`
    : `${countries.length} ${countries.length === 1 ? "country" : "countries"}`;

  if (!visibleCountries.length) {
    elements.rows.innerHTML = `<tr><td colspan="5" class="empty-cell">${query ? "No matching countries. Try another search." : "No country records yet. Add your first country to get started."}</td></tr>`;
    return;
  }

  elements.rows.innerHTML = visibleCountries.map((country) => `
    <tr>
      <td class="country-cell"><span class="country-badge">${escapeHtml(initials(country.country_name))}</span>${escapeHtml(country.country_name)}</td>
      <td>${escapeHtml(country.capital)}</td>
      <td>${numberFormat.format(country.population)}</td>
      <td>${numberFormat.format(Number(country.area_sq_km))}</td>
      <td><div class="row-actions">
        <button class="row-action" type="button" data-action="edit" data-country="${escapeHtml(country.country_name)}" aria-label="Edit ${escapeHtml(country.country_name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z"/></svg>
        </button>
        <button class="row-action delete" type="button" data-action="delete" data-country="${escapeHtml(country.country_name)}" aria-label="Delete ${escapeHtml(country.country_name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>
        </button>
      </div></td>
    </tr>`).join("");
}

async function loadCountries() {
  elements.rows.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading countries…</td></tr>';
  try {
    countries = await request(API_URL);
    renderStats();
    renderTable();
  } catch (error) {
    elements.rows.innerHTML = `<tr><td colspan="5" class="empty-cell">${escapeHtml(error.message)}. Check that the API is running, then refresh.</td></tr>`;
    elements.tableCount.textContent = "Could not load records";
    showToast(error.message, true);
  }
}

function openCreateDialog() {
  editingCountry = null;
  elements.form.reset();
  elements.name.disabled = false;
  document.querySelector("#name-field").hidden = false;
  elements.title.textContent = "Add a country";
  elements.save.textContent = "Save country";
  elements.error.textContent = "";
  elements.dialog.showModal();
  elements.name.focus();
}

function openEditDialog(countryName) {
  const country = countries.find((item) => item.country_name === countryName);
  if (!country) return;
  editingCountry = country.country_name;
  elements.form.reset();
  elements.name.value = country.country_name;
  elements.name.disabled = true;
  document.querySelector("#name-field").hidden = false;
  elements.capital.value = country.capital;
  elements.population.value = country.population;
  elements.area.value = country.area_sq_km;
  elements.title.textContent = `Edit ${country.country_name}`;
  elements.save.textContent = "Save changes";
  elements.error.textContent = "";
  elements.dialog.showModal();
  elements.capital.focus();
}

async function saveCountry(event) {
  event.preventDefault();
  elements.error.textContent = "";
  elements.save.disabled = true;
  const values = {
    capital: elements.capital.value.trim(),
    population: Number(elements.population.value),
    area_sq_km: Number(elements.area.value),
  };

  try {
    if (editingCountry) {
      await request(`${API_URL}/${encodeURIComponent(editingCountry)}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      showToast(`${editingCountry} was updated.`);
    } else {
      await request(API_URL, {
        method: "POST",
        body: JSON.stringify({ country_name: elements.name.value.trim(), ...values }),
      });
      showToast(`${elements.name.value.trim()} was added.`);
    }
    elements.dialog.close();
    await loadCountries();
  } catch (error) {
    elements.error.textContent = error.message;
  } finally {
    elements.save.disabled = false;
  }
}

async function deleteCountry(countryName) {
  if (!window.confirm(`Delete ${countryName} from the database?`)) return;
  try {
    await request(`${API_URL}/${encodeURIComponent(countryName)}`, { method: "DELETE" });
    showToast(`${countryName} was deleted.`);
    await loadCountries();
  } catch (error) {
    showToast(error.message, true);
  }
}

function exportCsv() {
  const columns = ["country_name", "capital", "population", "area_sq_km"];
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.join(","), ...countries.map((country) => columns.map((column) => quote(country[column])).join(","))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "exported_countries.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("CSV export downloaded.");
}

document.querySelector("#add-button").addEventListener("click", openCreateDialog);
document.querySelector("#export-button").addEventListener("click", exportCsv);
document.querySelector("#refresh-button").addEventListener("click", loadCountries);
document.querySelector("#cancel-dialog").addEventListener("click", () => elements.dialog.close());
document.querySelector("#close-dialog").addEventListener("click", () => elements.dialog.close());
elements.form.addEventListener("submit", saveCountry);
elements.search.addEventListener("input", renderTable);
elements.rows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") openEditDialog(button.dataset.country);
  if (button.dataset.action === "delete") deleteCountry(button.dataset.country);
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
});

loadCountries();
