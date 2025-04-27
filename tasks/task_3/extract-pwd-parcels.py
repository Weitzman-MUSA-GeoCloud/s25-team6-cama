from dotenv import load_dotenv
load_dotenv()

import os
import pathlib
import requests
from google.cloud import storage

DATA_DIR = pathlib.Path(__file__).parent / 'raw_data'

# URL of the external GeoJSON dataset (replace this with the actual URL)
dataset_url = "https://opendata.arcgis.com/api/v3/datasets/84baed491de44f539889f2af178ad85c_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1"
filename = DATA_DIR / 'pwd_parcels.geojson'

# Fetch the GeoJSON dataset from the external website
response = requests.get(dataset_url)
response.raise_for_status()

with open(filename, 'wb') as f:
    f.write(response.content)

print(f'Downloaded{filename}')

bucket_name = os.getenv('DATA_LAKE_BUCKET')
raw_blobname = 'pwd_parcels/pwd_parcels_raw.geojson'

storage_client = storage.Client()
bucket = storage_client.bucket(bucket_name)
blob = bucket.blob(raw_blobname)
blob.upload_from_filename(filename)

print(f'Uploaded {raw_blobname} to {bucket_name}')