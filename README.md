# Public Libraries Activity Dataset

An interactive web application and data processing pipeline visualising the official Public Libraries Activity Dataset for England, published by Arts Council England (ACE).

The live dashboard is available at [activity.librarydata.uk](https://activity.librarydata.uk).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

To run the web application locally, you will need:

* **Node.js** (v18 or higher recommended)

To run or modify the data transformation script, you will also need:

* **Python** (v3.10 or higher)
* **openpyxl** (Python library for reading `.xlsx` spreadsheets)

### Installing

A step-by-step series of examples that tell you how to get a development environment running:

1. Clone the repository to your local machine:

```bash
git clone https://github.com/LibrariesHacked/public-libraries-activity-dataset.git
cd public-libraries-activity-dataset
```

2. Install the frontend dependencies:

```bash
npm install
```

3. (Optional) Set up Python dependencies if running the data transformation scripts:

```bash
pip install openpyxl
```

4. Start the local Vite development server:

```bash
npm run dev
```

5. Open your browser and navigate to the local server URL (typically `http://localhost:5173`).

## Data Transformation Process

The repository contains an automated Python ingestion and rotation pipeline (`scripts/rotate_activity_data.py`) that processes raw survey spreadsheets published by ACE into standardised, machine-readable datasets.

```
Raw Excel Workbooks (data/)
        │
        ▼
rotate_activity_data.py ────► Anomaly & Quality Mapping (DATA_QUALITY_ANOMALIES)
        │
        ├──► Normalised CSVs (data/)
        │      (services, loans, visits, events, attendance, computers, wifi, users)
        │
        └──► Web-Optimised JSON (public/)
               (compact arrays consumed client-side by Vite/React)
```

### 1. Raw Data Sources

* **Library Activity Workbooks (`data/`):**
  * `Libraries Activity Data 2023-24 FINAL.xlsx`: Standalone workbook using descriptive text column labels.
  * `Libraries Activity Data - official statistic release.xlsx`: Multi-year official statistics release using survey question codes (covering `2024/2025` and `2025/2026`).
* **Demographic & Geographic Reference Data:**
  * `data/mye24tablesew.csv`: ONS mid-year 2024 population estimates by single year of age for England and Wales.
  * `data/uk_local_authorities.csv`: Register of UK local authorities with GSS codes and canonical names from My Society.
  * `data/library_authorities.json`: Master registry of English library authorities.
  * `data/localauthoritynearestneighboursengland.csv`: ONS Nearest Neighbours model mapping 5 comparator authorities per English library service.

### 2. Normalisation & Schema Mapping

The script configures year-specific parser mappings in `YEAR_SOURCES` to handle structural changes between survey iterations:
* **Survey Question Code Mappings:** Maps annual survey codes (`Q4`, `Q7`, `Q8`, `Q12`, `Q17`, etc.) to unified domain metrics across physical and digital lending, events, attendance, visits, and digital access.
* **Demographic Shifts:** Corrects for question order discrepancies between years (such as index shifts between teen `12-17` and adult `18+` categories).
* **Calendar Suffixes:** Translates survey month numbers (April through March) into standard ISO calendar month strings (`YYYY-MM`).
* **Authority Name Aliasing:** Resolves spelling variations and boundary naming discrepancies to standard GSS authority codes.

### 3. Data Quality & Anomaly Handling

To prevent data distortions while maintaining audit transparency, raw survey anomalies are catalogued in `DATA_QUALITY_ANOMALIES`:
* **`excluded`:** Unresolvable corrupted values (e.g. hardware timer overflows of 2.2 billion hours, or millisecond timestamps) are excluded from headline aggregates.
* **`replaced`:** Systemic errors (e.g. minutes reported instead of hours, misread units, extra trailing zeroes) where an estimated correction is calculated.
* **`suspicious`:** Irregular returns (such as reporting cumulative historical cardholders rather than 12-month active borrowers) flagged for transparency.

Both original reported values and corrected estimates are preserved in the data, allowing users to toggle between **Original data** and **Corrected data** on the frontend dashboard.

### 4. Running the Transformation

To re-run the transformation pipeline and regenerate all CSV and JSON outputs:

```bash
python scripts/rotate_activity_data.py
```

Outputs will be written to:
* `data/*.csv`: Detailed open datasets for analysis and download.
* `public/*.json`: Compact positional JSON datasets consumed directly by the React dashboard.

## Running the Tests

Explain how to run the automated tests and code quality checks for this system.

### Coding Style Tests

This project enforces [JavaScript Standard Style](https://standardjs.com/) with ESLint:

```bash
npm run lint
```

This verifies code formatting, React hook dependencies, and ensures no syntax or lint errors exist.

### Production Build Verification

To verify that all components, charts, and assets compile correctly into production bundles:

```bash
npm run build
```

You can preview the built application locally using:

```bash
npm run preview
```

## Deployment

The application is deployed as a static Single Page Application (SPA) to GitHub Pages.

### Manual Deployment

To build and deploy directly to the `gh-pages` branch:

```bash
npm run deploy
```

### Automated CI/CD

An automated GitHub Actions workflow is configured in `.github/workflows/main.yml`. Any push to the `main` branch:
1. Checks out the repository.
2. Sets up Node.js.
3. Installs dependencies and executes `vite build`.
4. Deploys the production `dist/` directory to the `gh-pages` branch.

A custom domain is configured via `public/CNAME` pointing to `activity.librarydata.uk`.

## Built With

* [React 19](https://react.dev/) - Frontend UI library
* [Vite](https://vitejs.dev/) - Build tool and development server
* [Material UI](https://mui.com/) - Design system and UI components
* [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/) - Accessible charts following ONS visualisation guidance
* [MapLibre GL](https://maplibre.org/) & [react-map-gl](https://visgl.github.io/react-map-gl/) - Interactive geographic map visualisations
* [Python](https://www.python.org/) & [openpyxl](https://openpyxl.readthedocs.io/) - Data rotation, anomaly handling, and JSON export

## Contributing

Please feel free to submit issues or pull requests to improve the visualisations, documentation, or data pipeline:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/LibrariesHacked/public-libraries-activity-dataset/tags).

## Authors

* **Libraries Hacked** - *Initial work and maintenance* - [Libraries Hacked](https://github.com/LibrariesHacked)

See also the list of [contributors](https://github.com/LibrariesHacked/public-libraries-activity-dataset/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

* [Arts Council England](https://www.artscouncil.org.uk/) for publishing public library activity datasets.
* [Office for National Statistics (ONS)](https://service-manual.ons.gov.uk/data-visualisation) for data visualisation principles and population data
