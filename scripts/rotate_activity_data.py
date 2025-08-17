import csv

input_file = './data/libraries_activity_data_2023_2024.csv'
members_file = './data/members_2023_2024.csv'
events_file = './data/events_2023_2024.csv'
event_attendance_file = './data/event_attendance_2023_2024.csv'
issues_file = './data/issues_2023_2024.csv'
visits_file = './data/visits_2023_2024.csv'
computer_usage_file = './data/computer_usage_2023_2024.csv'
metadata_file = './data/libraries_metadata.csv'

with open(input_file, mode='r', newline='', encoding='utf-8') as infile, \
    open(members_file, mode='w', newline='', encoding='utf-8') as outfile, \
    open(events_file, mode='w', newline='', encoding='utf-8') as events_outfile, \
    open(event_attendance_file, mode='w', newline='', encoding='utf-8') as event_attendance_outfile, \
    open(issues_file, mode='w', newline='', encoding='utf-8') as issues_outfile, \
    open(visits_file, mode='w', newline='', encoding='utf-8') as visits_outfile, \
    open(computer_usage_file, mode='w', newline='', encoding='utf-8') as computer_usage_outfile, \
    open(metadata_file, mode='w', newline='', encoding='utf-8') as metadata_outfile:
    reader = csv.DictReader(infile)

    members_writer = csv.DictWriter(outfile, fieldnames=['Authority', 'Age group', 'Count'])
    members_writer.writeheader()

    events_writer = csv.DictWriter(events_outfile, fieldnames=['Authority', 'Event type', 'Age group', 'Month', 'Count'])
    events_writer.writeheader()

    for row in reader:
       # Adjust these keys based on your actual CSV column names
       # We need to rotate the data by changing the column name to be the measure
       for header, value in row.items():
            
            authority = row['authority']

            # Month is a common aspect of the header name e.g. 'september'.
            # This is for financial year 2023-2024, so we need to adjust the month to YYYY-MM format. Use header includes for the month name
            if 'april' in header:
                month = '2023-04'
            elif 'may' in header:
                month = '2023-05'
            elif 'june' in header:
                month = '2023-06'
            elif 'july' in header:
                month = '2023-07'
            elif 'august' in header:
                month = '2023-08'
            elif 'september' in header:
                month = '2023-09'
            elif 'october' in header:
                month = '2023-10'
            elif 'november' in header:
                month = '2023-11'
            elif 'december' in header:
                month = '2023-12'
            elif 'january' in header:
                month = '2024-01'
            elif 'february' in header:
                month = '2024-02'
            elif 'march' in header:
                month = '2024-03'
            else:
                month = None

            # Age group is a common aspect of the header name e.g. 'adults', '11_under', '12_17', 'all_ages'
            # We will use this to determine the age group for the members and events data
            age_group = None

            if 'adults' in header:
                age_group = 'Adults'
            elif '11_under' in header:
                age_group = 'Under 12'
            elif '12_17' in header:
                age_group = '12-17'
            elif 'all_ages' in header:
                age_group = 'All Ages'

            # Start with members - these are the columns total_active_members	active_members_11_under	active_members_adults	active_members_12_17
            # We want a schema of Authority, Age Group, Count
            if header.startswith('total_active_members') or header.startswith('active_members'):
                
                if header == 'total_active_members':
                    age_group = 'Total'
                elif header == 'active_members_11_under':
                    age_group = 'Under 12'
                elif header == 'active_members_adults':
                    age_group = 'Adults'
                elif header == 'active_members_12_17':
                    age_group = '12-17'
                else:
                    continue

                members_writer.writerow({'Authority': authority, 'Age group': age_group, 'Count': value})

            # Now events - these are the columns total_physical_events_april,total_physical_events_may,total_physical_events_june,total_physical_events_july,total_physical_events_august,total_physical_events_september,total_physical_events_october,total_physical_events_november,total_physical_events_december,total_physical_events_january,total_physical_events_february,total_physical_events_march,physical_events_adults_april,physical_events_adults_may,physical_events_adults_june,physical_events_adults_july,physical_events_adults_august,physical_events_adults_september,physical_events_adults_october,physical_events_adults_november,physical_events_adults_december,physical_events_adults_january,physical_events_adults_february,physical_events_adults_march,physical_events_11_under_april,physical_events_11_under_may,physical_events_11_under_june,physical_events_11_under_july,physical_events_11_under_august,physical_events_11_under_september,physical_events_11_under_october,physical_events_11_under_november,physical_events_11_under_december,physical_events_11_under_january,physical_events_11_under_february,physical_events_11_under_march,physical_events_12_17_april,physical_events_12_17_may,physical_events_12_17_june,physical_events_12_17_july,physical_events_12_17_august,physical_events_12_17_september,physical_events_12_17_october,physical_events_12_17_november,physical_events_12_17_december,physical_events_12_17_january,physical_events_12_17_february,physical_events_12_17_march,physical_events_all_ages_april,physical_events_all_ages_may,physical_events_all_ages_june,physical_events_all_ages_july,physical_events_all_ages_august,physical_events_all_ages_september,physical_events_all_ages_october,physical_events_all_ages_november,physical_events_all_ages_december,physical_events_all_ages_january,physical_events_all_ages_february,physical_events_all_ages_march,total_digital_events_april,total_digital_events_may,total_digital_events_june,total_digital_events_july,total_digital_events_august,total_digital_events_september,total_digital_events_october,total_digital_events_november,total_digital_events_december,total_digital_events_january,total_digital_events_february,total_digital_events_march,digital_events_adults_april,digital_events_adults_may,digital_events_adults_june,digital_events_adults_july,digital_events_adults_august,digital_events_adults_september,digital_events_adults_october,digital_events_adults_november,digital_events_adults_december,digital_events_adults_january,digital_events_adults_february,digital_events_adults_march,digital_events_11_under_april,digital_events_11_under_may,digital_events_11_under_june,digital_events_11_under_july,digital_events_11_under_august,digital_events_11_under_september,digital_events_11_under_october,digital_events_11_under_november,digital_events_11_under_december,digital_events_11_under_january,digital_events_11_under_february,digital_events_11_under_march,digital_events_12_17_april,digital_events_12_17_may,digital_events_12_17_june,digital_events_12_17_july,digital_events_12_17_august,digital_events_12_17_september,digital_events_12_17_october,digital_events_12_17_november,digital_events_12_17_december,digital_events_12_17_january,digital_events_12_17_february,digital_events_12_17_march,digital_events_all_ages_april,digital_events_all_ages_may,digital_events_all_ages_june,digital_events_all_ages_july,digital_events_all_ages_august,digital_events_all_ages_september,digital_events_all_ages_october,digital_events_all_ages_november,digital_events_all_ages_december,digital_events_all_ages_january,digital_events_all_ages_february,digital_events_all_ages_march
            if header.startswith('total_physical_events') or header.startswith('physical_events') or header.startswith('total_digital_events') or header.startswith('digital_events'):
                
                if header.startswith('total_physical_events'):
                    event_type = 'Physical'
                elif header.startswith('physical_events'):
                    event_type = 'Physical'
                elif header.startswith('total_digital_events'):
                    event_type = 'Digital'
                elif header.startswith('digital_events'):
                    event_type = 'Digital'
                else:
                    continue

                if 'adults' in header:
                    age_group = 'Adults'
                elif '11_under' in header:
                    age_group = 'Under 12'
                elif '12_17' in header:
                    age_group = '12-17'
                elif 'all_ages' in header:
                    age_group = 'All Ages'
                else:
                    continue
                
                events_writer.writerow({
                    'Authority': authority,
                    'Event type': event_type,
                    'Age group': age_group,
                    'Month': month,
                    'Count': value
                })

