# About

The **Public Libraries Activity Dataset** dashboard provides an interactive tool for exploring and analysing public library usage data across England.

It is created and maintained by [Libraries Hacked](https://www.librarieshacked.org), an open data initiative promoting the use of open data in public libraries.

## The Data

The figures on this site are derived from the official Public Libraries Activity Dataset collected and published by [Arts Council England (ACE)](https://www.artscouncil.org.uk/supporting-arts-museums-and-libraries/supporting-libraries).

The survey captures headline activity metrics across all English library services, including:

* **Loans:** Physical books, audiobooks, ebooks, and digital audio loans across audience categories (adult, teen, children).
* **Visits:** In-person attendance across permanent branch libraries and mobile library stops.
* **Events & Attendance:** Scheduled physical and virtual activities, workshops, and attendee counts.
* **Computers & Wi-Fi:** Public desktop terminal access hours and wireless internet login sessions.
* **Active Users:** Registered cardholders who have borrowed items or used services within the last 12 months.

## Comparisons & Population Context

To support meaningful comparisons between authorities of different geographic and population scales:

* Per-capita rates are calculated using official Office for National Statistics (ONS) mid-year population estimates.
* Comparisons can be viewed **by service** or aggregated **by region**.
* When viewing an individual library service, the dashboard highlights its 5 demographic comparator services based on the ONS Nearest Neighbours statistical model.

## Data Quality & Corrections

Library returns are self-reported by individual local authorities and can occasionally contain anomalies, such as hardware counter corruptions, unit confusions (e.g. entering computer usage in minutes rather than hours), or typographical errors.

To maintain transparency:

* Both **Original data** and **Corrected data** views are supported throughout the dashboard.
* Every adjustment is catalogued in a master [Errors & corrections register](https://github.com/LibrariesHacked/public-libraries-activity-dataset/blob/master/data/errors.csv) which is fully visible on the dashboard and available for download.

## Open Source

This project is open source and open data:

* Source code and automated data rotation scripts are hosted on [GitHub](https://github.com/LibrariesHacked/public-libraries-activity-dataset).
* If you spot an error, have feedback, or would like to contribute, please [raise an issue on GitHub](https://github.com/LibrariesHacked/public-libraries-activity-dataset/issues) or reach out via [Libraries Hacked](https://www.librarieshacked.org).
