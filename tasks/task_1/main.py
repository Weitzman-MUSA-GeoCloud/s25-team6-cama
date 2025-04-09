from dotenv import load_dotenv
load_dotenv() 

import os
import pathlib
import requests
import json
import csv
from google.cloud import storage
from google.cloud import bigquery
import functions_framework



# Set up the directory for storing raw data
DATA_DIR = pathlib.Path(__file__).parent / 'raw_data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

@functions_framework.http
def extract_phl_opa_assessments(request):
    DATA_DIR = pathlib.Path(__file__).parent / 'raw_data'
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Download the OPA assessments data as a CSV
    url = "https://opendata-downloads.s3.amazonaws.com/assessments.csv"
    filename = DATA_DIR / 'opa_assessments.csv'

    response = requests.get(url)
    response.raise_for_status()

    # Save the content of the response to a local file
    with open(filename, 'wb') as f:
        f.write(response.content)

    print(f'Downloaded {filename}')

    # Upload the downloaded file to cloud storage
    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_RAW')
    blobname = 'opa_assessments/opa_assessments.csv'

    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(blobname)
    blob.upload_from_filename(filename)

    print(f'Uploaded {blobname} to {BUCKET_NAME}')

    # Return response
    return f'Downloaded and uploaded gs://{BUCKET_NAME}/{blobname}'

@functions_framework.http
def prepare_opa_assessments(request):

    
    DATA_DIR = pathlib.Path(__file__).parent 
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Retrieve bucket names
    bucket_name_raw = os.getenv('DATA_LAKE_BUCKET_RAW')
    bucket_name_prepare = os.getenv('DATA_LAKE_BUCKET_PREPARED')

    # Ensure bucket names are set
    if not bucket_name_raw or not bucket_name_prepare:
        raise ValueError("Bucket name is not set. Check your .env file and environment variables.")

    # Initialize Google Cloud Storage client
    storage_client = storage.Client()
    bucket_raw = storage_client.bucket(bucket_name_raw)

    # Define file paths
    raw_filename = DATA_DIR / 'raw_data/opa_assessments.csv'
    prepared_filename = DATA_DIR / 'raw_data/opa_assessments.jsonl'

    # Download the raw data from the bucket
    raw_blobname = 'opa_assessments/opa_assessments.csv'
    blob = bucket_raw.blob(raw_blobname)
    blob.download_to_filename(raw_filename)
    print(f'Downloaded to {raw_filename}')

    # Load the data from the CSV file
    with open(raw_filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # Write the data to a JSONL file
    with open(prepared_filename, 'w', encoding='utf-8') as f:
        for row in data:
            f.write(json.dumps(row) + '\n')

    print(f'Processed data into {prepared_filename}')

    # Upload the prepared data to the bucket
    bucket_prepare = storage_client.bucket(bucket_name_prepare)
    prepared_blobname = 'opa_assessments/data.jsonl'
    blob = bucket_prepare.blob(prepared_blobname)
    blob.upload_from_filename(prepared_filename, timeout=300)

    print(f'Uploaded to {prepared_blobname}')

    return f"Successfully prepared and uploaded the file to {prepared_blobname}"


@functions_framework.http
def load_opa_assessments(request):
    """Function to create/update external and internal tables in BigQuery."""
    SOURCE_DATASET = "source"
    CORE_DATASET = "core"
    TABLE_NAME = "opa_assessments"
    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_PREPARED')
    BLOB_NAME = "opa_assessments/data.jsonl"
    try:
        client = bigquery.Client()

        # Define the external table URI
        table_uri = f'gs://{BUCKET_NAME}/{BLOB_NAME}'

        # SQL to create/update external table
        create_external_table_query = f"""
        CREATE OR REPLACE EXTERNAL TABLE `{SOURCE_DATASET}.{TABLE_NAME}`(
            parcel_number STRING,
            year STRING,
            market_value FLOAT64,
            taxable_land FLOAT64,
            taxable_building FLOAT64,
            exempt_land FLOAT64,
            exempt_building FLOAT64,
            objectid STRING
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