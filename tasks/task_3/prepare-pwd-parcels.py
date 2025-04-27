from dotenv import load_dotenv
load_dotenv()

import os
import json
import pathlib
from google.cloud import storage

RAW_DATA_DIR = pathlib.Path(__file__).parent / 'raw_data'
PREPARED_DATA_DIR = pathlib.Path(__file__).parent / 'prepared_data'

raw_filename = RAW_DATA_DIR / 'pwd_parcels.geojson'
prepared_filename = PREPARED_DATA_DIR / 'pwd_parcels.jsonl'

raw_bucket_name = os.getenv('DATA_LAKE_BUCKET_RAW')
storage_client = storage.Client()
raw_bucket = storage_client.bucket(raw_bucket_name)

raw_blobname = 'pwd_parcels/pwd_parcels_raw.geojson'
raw_blob = raw_bucket.blob(raw_blobname)
raw_blob.download_to_filename(raw_filename)

print(f'Downloaded to {raw_filename}')

with open(raw_filename, 'r') as f:
    data=json.load(f)

with open(prepared_filename, 'w') as f:
    for feature in data['features']:
        row = feature['properties']
        row['geog'] = (
            json.dumps(feature['geometry'])
            if feature['geometry'] and feature['geometry']['coordinates']
            else None
        )
        f.write(json.dumps(row) + '\n')

print(f'Processed data into {prepared_filename}')

prepared_bucket_name = os.getenv('DATA_LAKE_BUCKET_PREPARED')
storage_client = storage.Client()
prepared_bucket = storage_client.bucket(prepared_bucket_name)

prepared_blobname = 'pwd_parcels/pwd_parcels.jsonl'
prepared_blob = prepared_bucket.blob(prepared_blobname)
prepared_blob.upload_from_filename(prepared_filename)
print(f'Uploaded {prepared_blobname} to {prepared_bucket_name}')