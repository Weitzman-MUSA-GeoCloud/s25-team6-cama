## Deploying

_extract_pwd_parcels:

```shell
gcloud functions deploy extract_pwd_parcels ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=extract_pwd_parcels ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=8Gi ^
--timeout=480s ^
--trigger-http ^
--no-allow-unauthenticated
```

```shell
gcloud functions call extract_pwd_parcels ^
--region=us-east4 
```

_prepare_pwd_parcels:

```shell
gcloud functions deploy prepare_pwd_parcels ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=prepare_pwd_parcels ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=8Gi ^
--timeout=240s ^
--trigger-http ^
--no-allow-unauthenticated
```

```shell
gcloud functions call prepare_pwd_parcels ^
--region=us-east4 
```

_load_pwd_parcels:

```shell
gcloud functions deploy load_pwd_parcels ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=load_pwd_parcels ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=8Gi ^
--timeout=480s ^
--trigger-http ^
--no-allow-unauthenticated
```

```shell
gcloud functions call load_pwd_parcels ^
--region=us-east4 
```

_run_sql_:

```shell
gcloud functions deploy run_sql `
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=extract_pwd_parcels^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=4Gi ^
--timeout=480s ^
--trigger-http ^
--no-allow-unauthenticated
```

```shell
gcloud functions call run_sql
```

pipeline workflow:
```shell
gcloud workflows deploy parcels-data-pipeline ^
--source=parcels_pipeline.yaml ^
--location=us-east4 ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com

gcloud scheduler jobs create http parcels-data-pipeline ^
  --schedule="0 0 * * 1" ^
  --time-zone="America/New_York" ^
  --uri="https://workflowexecutions.googleapis.com/v1/projects/musa5090s25-team6/locations/us-east4/workflows/parcels-data-pipeline/executions" ^
  --http-method=POST ^
  --oauth-service-account-email="data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com" ^
  --location=us-east4

```

```shell
gcloud workflows run parcels-data-pipeline ^
  --location=us-east4