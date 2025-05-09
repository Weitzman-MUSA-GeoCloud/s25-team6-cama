from dotenv import load_dotenv
load_dotenv() 

import os
import pathlib
import requests
from google.cloud import storage
from google.cloud import bigquery
import functions_framework
import json
import csv


# Set up the directory for storing raw data
DATA_DIR = pathlib.Path(__file__).parent / 'raw_data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

@functions_framework.http
def extract_phl_opa_properties(request):
    # Download the OPA Properties data as a CSV
    url = 'https://opendata-downloads.s3.amazonaws.com/opa_properties_public.csv'
    filename = DATA_DIR / 'opa_properties.csv'

    response = requests.get(url)
    response.raise_for_status()

    # Save the content of the response to a local file
    with open(filename, 'wb') as f:
        f.write(response.content)

    print(f'Downloaded {filename}')

    # Upload the downloaded file to cloud storage
    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_RAW')
    blobname = 'opa_properties/opa_properties.csv'

    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(blobname)
    blob.upload_from_filename(filename)

    print(f'Uploaded {blobname} to {BUCKET_NAME}')

    # Return response
    return f'Downloaded and uploaded gs://{BUCKET_NAME}/{blobname}'

@functions_framework.http
def prepare_opa_properties(request):
    # Define data directory
    DATA_DIR = pathlib.Path(__file__).parent
    raw_dir = DATA_DIR / 'raw_data'
    prepared_dir = DATA_DIR / 'prepared_data'

    # Ensure subdirectories exist
    raw_dir.mkdir(parents=True, exist_ok=True)
    prepared_dir.mkdir(parents=True, exist_ok=True)

    # Retrieve bucket names from environment
    bucket_name_raw = os.getenv('DATA_LAKE_BUCKET_RAW')
    bucket_name_prepare = os.getenv('DATA_LAKE_BUCKET_PREPARED')

    if not bucket_name_raw or not bucket_name_prepare:
        raise ValueError("Bucket name is not set. Check your environment variables.")

    # Initialize GCS client and buckets
    storage_client = storage.Client()
    bucket_raw = storage_client.bucket(bucket_name_raw)
    bucket_prepare = storage_client.bucket(bucket_name_prepare)

    # File paths
    raw_filename = raw_dir / 'opa_properties.csv'
    prepared_filename = prepared_dir / 'opa_properties.jsonl'

    # Download raw CSV from cloud storage
    raw_blobname = 'opa_properties/opa_properties.csv'
    blob = bucket_raw.blob(raw_blobname)

    try:
        blob.download_to_filename(raw_filename)
        print(f'Downloaded to {raw_filename}')
    except Exception as e:
        return f"Failed to download raw data: {e}", 500

    # Convert CSV to JSONL
    try:
        with open(raw_filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data = list(reader)

        with open(prepared_filename, 'w', encoding='utf-8') as f:
            for row in data:
                f.write(json.dumps(row) + '\n')

        print(f'Processed data into {prepared_filename}')
    except Exception as e:
        return f"Failed to process file: {e}", 500

    # Upload prepared JSONL to bucket
    prepared_blobname = 'opa_properties/data.jsonl'
    blob = bucket_prepare.blob(prepared_blobname)

    try:
        blob.upload_from_filename(prepared_filename, timeout=300)
        print(f'Uploaded to {prepared_blobname}')
    except Exception as e:
        return f"Failed to upload prepared file: {e}", 500

    return f"Successfully prepared and uploaded the file to {prepared_blobname}", 200

@functions_framework.http
def load_opa_properties(request):
    """Function to create/update external and internal tables in BigQuery."""
    SOURCE_DATASET = "source"
    CORE_DATASET = "core"
    TABLE_NAME = "opa_properties"
    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_PREPARED')
    BLOB_NAME = "opa_properties/opa_properties.jsonl"
    try:
        client = bigquery.Client()

        # Define the external table URI
        table_uri = f'gs://{BUCKET_NAME}/{BLOB_NAME}'

        # SQL to create/update external table
        create_external_table_query = f"""
        CREATE OR REPLACE EXTERNAL TABLE `{SOURCE_DATASET}.{TABLE_NAME}`(
            objectid STRING,
            assessment_date STRING,
            basements STRING,
            beginning_point STRING,
            book_and_page STRING,
            building_code STRING,
            building_code_description STRING,
            category_code STRING,
            category_code_description STRING,
            census_tract STRING,
            central_air STRING,
            cross_reference STRING,
            date_exterior_condition STRING,
            depth STRING,
            exempt_building STRING,
            exempt_land STRING,
            exterior_condition STRING,
            fireplaces STRING,
            frontage STRING,
            fuel STRING,
            garage_spaces STRING,
            garage_type STRING,
            general_construction STRING,
            geographic_ward STRING,
            homestead_exemption STRING,
            house_extension STRING,
            house_number STRING,
            interior_condition STRING,
            location STRING,
            mailing_address_1 STRING,
            mailing_address_2 STRING,
            mailing_care_of STRING,
            mailing_city_state STRING,
            mailing_street STRING,
            mailing_zip STRING,
            market_value STRING,
            market_value_date STRING,
            number_of_bathrooms STRING,
            number_of_bedrooms STRING,
            number_of_rooms STRING,
            number_stories STRING,
            off_street_open STRING,
            other_building STRING,
            owner_1 STRING,
            owner_2 STRING,
            parcel_number STRING,
            parcel_shape STRING,
            quality_grade STRING,
            recording_date STRING,
            registry_number STRING,
            sale_date STRING,
            sale_price STRING,
            separate_utilities STRING,
            sewer STRING,
            site_type STRING,
            state_code STRING,
            street_code STRING,
            street_designation STRING,
            street_direction STRING,
            street_name STRING,
            suffix STRING,
            taxable_building STRING,
            taxable_land STRING,
            topography STRING,
            total_area STRING,
            total_livable_area STRING,
            type_heater STRING,
            unfinished STRING,
            unit STRING,
            utility STRING,
            view_type STRING,
            year_built STRING,
            year_built_estimate STRING,
            zip_code STRING,
            zoning STRING,
            pin STRING,
            building_code_new STRING,
            building_code_description_new STRING,
            geog STRING
        )
        OPTIONS (
          format = 'JSON',
          uris = ['{table_uri}']
        )
        """

        # Execute external table creation
        print("Creating/updating external table...")
        client.query(create_external_table_query).result()
        print(f"External table `{SOURCE_DATASET}.{TABLE_NAME}` updated successfully.")

        # SQL to create/update internal table with additional field
        create_internal_table_query = f"""
        CREATE OR REPLACE TABLE `{CORE_DATASET}.{TABLE_NAME}` AS
        SELECT *, parcel_number AS property_id
        FROM `{SOURCE_DATASET}.{TABLE_NAME}`
        """
        
        # Execute internal table creation
        print("Creating/updating internal table...")
        client.query(create_internal_table_query).result()
        print(f"Internal table `{CORE_DATASET}.{TABLE_NAME}` updated successfully.")

        return "Successfully created and updated BigQuery tables."

    except Exception as e:
        print(f"Error: {e}")
        return f"Error occurred: {e}", 500
    

@functions_framework.http
def run_sql(request):
    # Read the SQL file specified in the request
    sql_path = SQL_DIR_NAME / request.args.get('sql')

    # Check that the file exists
    if (not sql_path.exists()) or (not sql_path.is_file()):
        # Return a 404 (not found) response if not
        return f'File {sql_path} not found', 404

    # Read the SQL file
    with open(sql_path, 'r', encoding='utf-8') as sql_file:
        sql_query_template = sql_file.read()
        sql_query = render_template(
            sql_query_template,
            {
                'bucket_name': os.getenv('DATA_LAKE_BUCKET'),
                'dataset_name': os.getenv('DATA_LAKE_DATASET'),
            }
        )

    # Run the SQL query
    bigquery_client = bigquery.Client()
    bigquery_client.query_and_wait(sql_query)

    print(f'Ran the SQL file {sql_path}')
    return f'Ran the SQL file {sql_path}'


def render_template(sql_query_template, context):
    clean_template = sql_query_template.replace('${', '{')
    return clean_template.format(**context)