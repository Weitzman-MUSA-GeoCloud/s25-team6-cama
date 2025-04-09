from dotenv import load_dotenv
load_dotenv()

import os
import pathlib
import requests
import json
import csv
from shapely.geometry import shape
from google.cloud import storage
from google.cloud import bigquery
import functions_framework


# ---------------------------
# Extract function
# ---------------------------
@functions_framework.http
def extract_pwd_parcels(request):
    DATA_DIR = pathlib.Path('/tmp/raw_data')
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    url = (
        'https://opendata.arcgis.com/api/v3/datasets/84baed491de44f539889f2af178ad85c_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1'
    )
    filename = DATA_DIR / 'pwd_parcels.geojson'

    response = requests.get(url)
    response.raise_for_status()

    with open(filename, 'wb') as f:
        f.write(response.content)

    print(f'Downloaded {filename}')

    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_RAW')
    if not BUCKET_NAME:
        return "Environment variable DATA_LAKE_BUCKET_RAW not set.", 500

    blobname = 'pwd_parcels/pwd_parcels.geojson'
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(blobname)
    blob.upload_from_filename(filename)

    print(f'Uploaded {blobname} to {BUCKET_NAME}')
    return f'Downloaded and uploaded gs://{BUCKET_NAME}/{blobname}'


# ---------------------------
# Prepare function
# ---------------------------
@functions_framework.http
def prepare_pwd_parcels(request):
    DATA_DIR = pathlib.Path('/tmp')
    raw_dir = DATA_DIR / 'raw_data'
    raw_dir.mkdir(parents=True, exist_ok=True)

    bucket_name_raw = os.getenv('DATA_LAKE_BUCKET_RAW')
    bucket_name_prepare = os.getenv('DATA_LAKE_BUCKET_PREPARED')

    if not bucket_name_raw or not bucket_name_prepare:
        raise ValueError("Bucket name is not set. Check your environment variables.")

    storage_client = storage.Client()
    bucket_raw = storage_client.bucket(bucket_name_raw)

    raw_filename = raw_dir / 'pwd_parcels.geojson'
    prepared_filename = raw_dir / 'pwd_parcels.jsonl'

    raw_blobname = 'pwd_parcels/pwd_parcels.geojson'
    blob = bucket_raw.blob(raw_blobname)
    blob.download_to_filename(raw_filename)
    print(f'Downloaded to {raw_filename}')
# Load and process the GeoJSON data
    with open(raw_filename, 'r') as f:
        geojson = json.load(f)

    features = geojson['features']

    with open(prepared_filename, 'w') as f:
        for feature in features:
            properties = feature.get('properties', {})
            properties = {k.lower(): v for k, v in properties.items()}  # Lowercase keys
            geometry = feature.get('geometry')

            if geometry:
                geom = shape(geometry)
                properties['geog'] = geom.wkt
            else:
                properties['geog'] = None

            f.write(json.dumps(properties) + '\n')

    print(f'Processed data into {prepared_filename}')

    bucket_prepare = storage_client.bucket(bucket_name_prepare)
    prepared_blobname = 'pwd_parcels/data.jsonl'
    blob = bucket_prepare.blob(prepared_blobname)
    blob.upload_from_filename(prepared_filename, timeout=300)

    print(f'Uploaded to {prepared_blobname}')
    return f"Successfully prepared and uploaded the file to {prepared_blobname}"


# ---------------------------
# Load to BigQuery
# ---------------------------
@functions_framework.http
def load_pwd_parcels(request):
    SOURCE_DATASET = "source"
    CORE_DATASET = "core"
    TABLE_NAME = "opa_parcels"
    BUCKET_NAME = os.getenv('DATA_LAKE_BUCKET_PREPARED')
    BLOB_NAME = "opa_parcels/data.jsonl"

    try:
        client = bigquery.Client()
        table_uri = f'gs://{BUCKET_NAME}/{BLOB_NAME}'

        external_sql = f"""
        CREATE OR REPLACE EXTERNAL TABLE `{SOURCE_DATASET}.{TABLE_NAME}`(
                objectid STRING,
                parcelid STRING,
                tencode STRING,
                address STRING,
                owner1 STRING,
                owner2 STRING,
                bldg_code STRING,
                bldg_desc STRING,
                brt_id STRING,
                num_brt STRING,
                num_accounts STRING,
                gross_area STRING,
                pin STRING,
                parcel_id STRING,
                shape__area STRING,
                shape__length STRING,
                geog STRING
        )
        OPTIONS (
          format = 'JSON',
          uris = ['{table_uri}']
        )
        """

        print("Creating/updating external table...")
        client.query(external_sql).result()
        print(f"External table `{SOURCE_DATASET}.{TABLE_NAME}` updated successfully.")

        internal_sql = f"""
        CREATE OR REPLACE TABLE `{CORE_DATASET}.{TABLE_NAME}` AS
        SELECT *, parcel_id AS property_id,
        FROM `{SOURCE_DATASET}.{TABLE_NAME}`
        """

        print("Creating/updating internal table...")
        client.query(internal_sql).result()
        print(f"Internal table `{CORE_DATASET}.{TABLE_NAME}` updated successfully.")

        return "Successfully created and updated BigQuery tables."

    except Exception as e:
        print(f"Error: {e}")
        return f"Error occurred: {e}", 500


# ---------------------------
# Run Custom SQL File
# ---------------------------
@functions_framework.http
def run_sql(request):
    SQL_DIR_NAME = pathlib.Path(__file__).parent / 'sql'
    sql_filename = request.args.get('sql')

    if not sql_filename:
        return "Missing 'sql' query parameter", 400

    sql_path = SQL_DIR_NAME / sql_filename
    if not sql_path.exists() or not sql_path.is_file():
        return f'File {sql_path} not found', 404

    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_query_template = f.read()

    sql_query = render_template(
        sql_query_template,
        {
            'bucket_name': os.getenv('DATA_LAKE_BUCKET'),
            'dataset_name': os.getenv('DATA_LAKE_DATASET'),
        }
    )

    bigquery_client = bigquery.Client()
    bigquery_client.query(sql_query).result()

    print(f'Ran the SQL file {sql_path}')
    return f'Ran the SQL file {sql_path}'


# ---------------------------
# SQL Template Renderer
# ---------------------------
def render_template(template: str, context: dict) -> str:
    clean_template = template.replace('${', '{')
    return clean_template.format(**context)
