# Source-return audit: 2023/24 to 2025/26

Audit date: 8 October 2026.

## Coverage and outcome

Every identifiable library service return in the three supplied worksheets was scanned, including zeroes, missing cells, age breakdowns, device inventories and available respondent explanations. This is a reproducible source-data audit, not confirmation from individual library services that unusual figures are wrong.

| Financial year | Source returns | Numeric source cells checked | Review findings |
| --- | ---: | ---: | ---: |
| 2023/2024 | 129 | 27,330 | 443 |
| 2024/2025 | 114 | 60,624 | 1,094 |
| 2025/2026 | 108 | 58,760 | 920 |
| Total | 351 | 146,714 | 2,457 |

The audit examined 185,247 mapped cells in total. Findings overlap: an unusual cell can also produce a category-total conflict and a year-to-year change. A finding is not necessarily an error. The review classified 997 findings as suspicious and 1,460 as informational. Only material findings were promoted to the public register: 792 new headline/category-series rules covering 177 service-year metric groups and 129 service-year returns. No new corrections or exclusions were inferred. Every existing original count, corrected count, period and classification in the ten exported datasets was verified unchanged; the follow-up below recovered two additional source records previously dropped by the importer.

The newer worksheets contain 114 and 108 identifiable service rows, despite publisher statements of 117 and 111 viable returns. These are different coverage counts; this audit cannot inspect returns not present in those sheets. The dashboard has 153 authority placeholders per year, which must not be mistaken for 153 submitted returns.

## Column mapping verification

All mapped source columns exist. The question descriptions confirm the age-group changes between years, and all month suffixes were checked against the actual month labels. All 9,097 annual formulas in the two newer worksheets were checked against the corresponding monthly question groups: 4,674 for 2024/25 and 4,423 for 2025/26. Thirteen computer-hours formulas legitimately use `ROUND(SUM(...),0)`; their underlying month ranges are correct. Five 2025/26 annual totals are directly entered rather than calculated by formulas.

**Important publisher labelling error:** 24 annual demographic total labels in the 2024/25 worksheet use the 2025/26 age ordering even though their question codes and formulas sum the 2024/25 groups. For example, `Q4_2_1` through `Q4_2_12` are adult physical events, while `Q4_2_Total` is labelled children. Its formula sums the adult monthly columns. The importer correctly follows the monthly question group, not the misleading annual label. The same mismatch affects physical/digital events, attendance, physical books/audiobooks, ebooks and digital audiobooks. These exceptions are marked in the column manifest and covered by tests.

Library-only and co-located visits map to the same intended categories in all three years. The internal name `physical_visits_no_colocation` is misleading: it feeds **Shared building**, not library-only visits. The source mappings are nevertheless consistent. Some returns may themselves swap those categories: Greenwich's library-only/co-located figures reverse scale in 2024/25 and reverse again in 2025/26. Surrey and Warwickshire also show substantial changes in the split. These are warnings about reported classification, not proven importer errors.

The audit also checks the four audience/attendance summary columns that the importer does not use. The 2025/26-only question `Q18a` about active users with vision or print impairments is checked, including whether it exceeds all active members, but is not added to the dashboard or treated as a comparable item in earlier years.

## Strong findings to investigate

| Return | Source evidence | Interpretation |
| --- | --- | --- |
| Wandsworth, 2025/26 events | All-ages physical events are exactly twice the total physical events in every month; the annual category sum is 20,385 against a reported total of 6,795. | Strong duplication or formula-error signal. |
| West Berkshire, 2025/26 events | All-ages counts are twice the physical-event total in eleven months; April is 782 against a total of 241. Category sum is 9,510 against a reported total of 3,070. | Strong duplication or classification-error signal. |
| Portsmouth, 2025/26 events | Reported total is exactly 25 every month, or 300 annually; the age categories total 2,811. | Headline and detail cannot both describe the same non-overlapping events. |
| Devon, 2025/26 physical audiobooks | Teen category is 59,217 annually against an all-age format total of 20,950; the teen monthly cells are zero. | Annual-only fallback must be respected, but the category exceeds the entire format total. |
| Wigan, 2025/26 physical audiobooks | Teen category is 5,683 annually against an all-age format total of 2,914. | Category/format conflict, not proof of an intended replacement. |
| Cambridgeshire, October 2025 book loans | Total physical books 12,843; adult category alone 49,977 and children 74,855. | Total is below either large category and around one tenth of its usual monthly scale. |
| East Riding of Yorkshire, 2023/24 book loans | April total 575,730 and adult loans 370,710; March total 438,840. Typical total month is about 60,852. | Large suspected typing/scoping errors; original values retained. |
| Derbyshire, April 2023 visits | 670,970 library-only visits against a median nonzero month of about 73,617. | Approximately ninefold spike, consistent with a possible extra digit. |
| Dudley visits | April 2023 library-only visits 544,456 against a median about 61,791; April 2024 co-located visits 155,914 against about 16,004. | Separate approximately tenfold spikes. |
| West Northamptonshire, 2024/25 | May book issues 247,407 against a median about 27,257; April attendance 30,080 against about 2,900. | Two independent approximately tenfold spikes. |
| Sefton active members | 36,004 in 2023/24, 192,095 in 2024/25, and 77,672 in 2025/26. | Check active versus registered membership and changes in scope. |
| Greenwich, 2023/24 digital events/attendance | Adult and teen series are identical in every supplied month. | Possible copied series or deliberate combined-age reporting. |
| Staffordshire, 2023/24 physical audiobooks | Under-12 and teen category series are identical in every supplied month. | Possible copied series or combined child classification. |
| Newcastle, 2023/24 and 2024/25 audiobooks | Physical and digital audiobook totals are identical in every supplied month, totalling 54,393 and 57,530 respectively. | Possible format duplication; investigate before adding the two formats together. |
| Peterborough, 2024/25 events/attendance | Physical events and physical attendance are identical in every supplied month, totalling 1,541 each. | Possible copied measure or events entered as attendance. |

### Published annual totals versus supplied months

These five conflicts remain after allowing annual-only reporting with zero-filled monthly cells:

| Return, 2025/26 | Published annual total | Supplied month sum | Annual minus months |
| --- | ---: | ---: | ---: |
| Calderdale physical events | 2,659 | 2,713 | -54 |
| Calderdale physical attendance | 35,243 | 26,446 | +8,797 |
| Greenwich physical events | 11,061 | 12,011 | -950 |
| Nottinghamshire physical events | 20,573 | 24,207 | -3,634 |
| Wigan digital attendance | 3,866 | 2,933 | +933 |

The published annual values and monthly values are both retained. The audit does not assume either is authoritative when they conflict. Likewise, category sums below totals can be valid uncategorised activity, and event audience categories can overlap.

### Follow-up: numbers stored as text

The two event-total discrepancies for Greenwich and Nottinghamshire have a specific spreadsheet cause, not evidence of stale calculation caches:

* Greenwich's April 2025 total is stored as the text `950` followed by a tab. Excel's annual `SUM` ignores that text cell, explaining the complete difference of 950.
* Nottinghamshire's April and September 2025 totals are stored as `1689` and `1945`, each followed by a tab. Excel ignores both, explaining the complete difference of 3,634.

These are the only three whitespace-padded numeric count cells across the mapped source returns. The importer also previously rejected them because it tested whether the entire untrimmed string was digits. It now trims surrounding whitespace before accepting an integer count. This recovers two Nottinghamshire physical-event records, with Unknown age group, for April (1,689) and September (1,945). Greenwich's age-category detail already retained its April activity, so no additional event row is needed there. All other original records, existing corrections and published headline values are unchanged. This is recovery of submitted values, not an inferred numerical correction.

Calderdale's two conflicting annual totals and Wigan's conflicting annual digital-attendance total are directly entered values. Their discrepancies remain unresolved; the register distinguishes them from the two text-number omissions.

The follow-up also corrected an explanatory-note error in 33 detailed audit findings: unrelated outreach comments had incorrectly inherited the sentence saying a service change explains the fall. That conclusion is now restricted to Rutland's documented 2024/25 home-delivery change. The erroneous sentence was not present in the published register.

### Export checks and public notes

Thirteen Python regression tests now cover source mappings/formulas, correction precedence, respondent context, unique records, non-negative counts, CSV/JSON totals and register consistency. Seven native Node tests cover shared monthly/annual table filtering, continuous financial-year selection, plain correction terminology, lossless grouping of every published register rule, and original/corrected data modes. They ensure zero remains a valid count, missing values stay missing, excluded figures stay excluded, and review-only figures remain unchanged. Pull requests and deployment run both suites; pull requests also build but never deploy the dashboard. The two workbook-dependent tests skip explicitly if the original spreadsheets are unavailable.

The financial-year reconciliation check identified another importer issue: any four dated values were previously treated as quarterly totals, even when they represented four ordinary months. Quarterly inference now requires June, September, December and March. This prevents sparse monthly figures from being shifted into the previous financial year. Reported category counts are preserved. Three derived Unknown-age loan counts caused by the previous quarter-spreading/reconciliation are no longer generated; total exported original loans therefore fall by three, without editing any reported source count.

The public register now groups rules by library service, year and measure. Mixed statuses remain searchable and visible in the details, unique evidence is retained, and downloads include all original rules. Readers see a short plain-English summary first, with the full evidence available by mouse, touch or keyboard. A collapsed glossary explains the main measures without lengthening the default view.

## Respondent explanations

All available nonempty explanation/collection responses were retained: 288 responses, including 104 legacy digital-collection Yes/No responses and 184 newer free-text explanations. The two legacy explanatory columns for mobile services and Wi-Fi contain no respondent text in the supplied workbook. No respondent explanation was available there to justify the existing 2023/24 computer exclusions; none was invented.

Relevant outreach explanations are attached to the related register notes, with their source question and an explicit indication that they concern outreach, not unrelated library-only visits or computer usage. There are 44 such annotations. Explanations are also included directly beside relevant audit findings. In particular:

* **Rutland, 2024/25:** Village home deliveries ended in October, with targeted housebound delivery from November. This explains the sharp fall; the outliers remain informational and are not promoted as suspected typing errors.
* **North Somerset:** The 2024/25 explanation describes mechanical faults and limited mobile provision pending a replacement vehicle. The 2025/26 explanation describes limited April-December provision while awaiting the new vehicle. The December dip is flagged with this context, not presented as a confirmed mistake.
* **North Tyneside, 2025/26:** The mobile service was discontinued in July. Missing/zero activity afterwards must not automatically be labelled bad data.
* **Peterborough, 2024/25:** Mobile service was suspended in January and February because qualified drivers were unavailable. Home delivery is measured as item issues, not visits.
* **Shropshire:** In 2024/25, mobile and home-delivery data come from an annual sample count. In 2025/26, mobile data cover only six months and home delivery is based on an April sample. These are not twelve months of directly observed interactions.
* **Bolton, Cambridgeshire, Hertfordshire, Oxfordshire, South Gloucestershire and Staffordshire:** Some home-delivery interaction figures are approximations based on registered users, assumed visits or delivery schedules. Oxfordshire describes visits approximately every three weeks, while several services assume monthly visits. Apparent monthly precision is not necessarily observed activity.
* **Nottinghamshire:** Home delivery counts annual customers, not volunteer visits. This is a definition difference, not interchangeable with interaction counts.
* **Derbyshire, Newcastle, York, Buckinghamshire, Dudley, Bexley, Warrington and West Sussex:** Explanations describe outreach already included in general visits, issues or service figures. Avoid assuming an absent separate figure means no service, or adding separately reported outreach without considering possible double counting.
* **Greenwich:** Residential-home loans are group loans; individual home-delivery interactions cannot be calculated from them.
* **Kent, Leeds, Northumberland, Nottingham and other services:** Relevant services may exist even though interaction data are not collected or compatible with the question. Missing values must not be silently interpreted as zero.
* **Windsor and Maidenhead, 2025/26:** One library operated click-and-collect from November to March during refurbishment. This is an explained change in provision.

Many other explanations simply say the service does not offer click-and-collect or mobile libraries. The full wording is retained in the explanation file, not interpreted as evidence about unrelated figures.

## Publisher caveats and limitations

ACE says some data were removed when accuracy was not confirmed; some verified extreme values were excluded only from headline tables because they obscured trends. Publisher exclusion is therefore not automatically evidence that a return is erroneous, and is different from this project's clearly impossible-value exclusions. ACE also cautions that changed reporting methods affect year-on-year comparisons.

Plausibility checks are screening criteria: at least five times or at most 15% of the median positive month, large matched-year changes, membership relative to population, and generous computer-hours/device benchmarks. The public-register promotion thresholds are stricter: monthly comparisons require a median of at least 1,000 and a ratio of at least eight or at most 12%; annual category conflicts must exceed 100 and 2% of the total; large annual changes must reach a fivefold increase/decrease. Existing corrections and exclusions are not replaced with speculative corrections. Population is the same ONS mid-2024 comparator for all years, non-resident borrowing is possible, and a year-end device inventory is not an annual average. City of London population flags are not promoted because its commuter/cross-boundary use makes resident population an unsuitable upper bound.

Quarterly zeros, annual-only entries and mixed reporting frequencies require care. Missing cells are distinct from explicit zeroes. An annual total calculated from the same monthly values is not independent evidence that a suspicious month is correct. This audit cannot verify individual service systems, original unpublished submissions, explanations absent from the supplied files, or values confirmed privately to ACE.

## Files and reproduction

* [activity_audit.csv](activity_audit.csv): Every review finding, numeric comparator, source column/row and relevant explanation. The known-issue flag describes related register coverage at the time of the scan, not proof that the same cause explains every finding.
* [activity_audit_coverage.csv](activity_audit_coverage.csv): Every available service-year return, numeric/missing/zero counts and its explanation fields.
* [activity_column_mappings.csv](activity_column_mappings.csv): Every year/metric/month-to-source-column assignment, questionnaire text and known misleading annual-label exceptions.
* [activity_respondent_explanations.csv](activity_respondent_explanations.csv): Full available explanation/collection-response wording with year, service, question and source row.
* [errors.csv](errors.csv) and [errors.json](../public/errors.json): Material suspicious notes alongside existing corrections and exclusions. Related series can share one note; the rule count is not a count of independent errors.

Run from the repository root:

```sh
python3 scripts/audit_activity_data.py
python3 -m unittest discover -s scripts -p 'test_*.py'
```

To explicitly update the register from material findings and regenerate the dashboard datasets:

```sh
python3 scripts/audit_activity_data.py --update-register
python3 scripts/rotate_activity_data.py
```