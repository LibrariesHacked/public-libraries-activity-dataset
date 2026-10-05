# Data Quality & Anomaly Register

The **Public Libraries Activity Dataset** visualises official survey returns collected and published by [Arts Council England (ACE)](https://www.artscouncil.org.uk/supporting-arts-museums-and-libraries/supporting-libraries).

Because the data is self-reported by individual local library authorities, submissions can occasionally contain reporting anomalies. Rather than silently discarding or modifying records, this project maintains an open audit register cataloguing every known reporting anomaly and correction.

## Types of Anomalies

* **Excluded (`excluded`):** Corrupted figures where the original recorded value cannot be salvaged or reliably estimated (for example, hardware timer counter resets recording millisecond values or 2.2 billion computer hours in a single month). These entries are excluded from headline aggregates to prevent heavy distortion.
* **Corrected (`replaced`):** Identifiable typographical or unit errors where a plausible correction can be established (for example, entering computer usage in minutes instead of hours, typing an extra trailing zero, or transposition typos). In the dashboard, users can toggle between **Original data** and **Corrected data**.
* **Standardised (`standardised`):** Reporting frequency or structure errors where quarterly totals were submitted under monthly questions with zero-placeholders for intermediate months. These are converted to ISO 8601 quarterly durations (`P3M`) and distributed evenly across quarter months to avoid false dips and spikes in time-series trends.
* **Notes (`suspicious`):** Irregular or atypical returns highlighted for transparency (such as reporting cumulative historical library cardholders rather than active borrowers within the last 12 months).

## Audit Register

The table below lists all catalogued anomaly rules across reporting periods and datasets. You can search, filter by authority or status, inspect original versus corrected values, and download the full register as a CSV file.
