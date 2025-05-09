

## Execute job
```shell
gcloud run jobs execute run-model --region us-central1
```

#### OLD:Only needed once when creating new job
```shell
gcloud artifacts repositories create run-model --repository-format=docker ^
--location=us-central1
```

#### OLD:Do whenever docker build is changed
```shell
gcloud builds submit ^
  --region us-central1 ^
  --tag us-central1-docker.pkg.dev/musa5090s25-team6/run-model/model-image:3
```


## OLD:Change to update/create depending on if job already exists
```shell
  gcloud run jobs update run-model ^
    --image us-central1-docker.pkg.dev/musa5090s25-team6/run-model/model-image:3^
    --service-account data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
    --cpu 4 ^
    --memory 4Gi ^
    --region us-central1 
```


pipeline workflow:
```shell
gcloud workflows deploy predictive_pipeline ^
--source=model_pipeline.yaml ^
--location=us-east4 ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com

gcloud scheduler jobs create http predictive_pipeline ^
  --schedule="0 0 * * 1" ^
  --time-zone="America/New_York" ^
  --uri="https://workflowexecutions.googleapis.com/v1/projects/musa5090s25-team6/locations/us-east4/workflows/phl-assessments-data-pipeline/executions" ^
  --http-method=POST ^
  --oauth-service-account-email="data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com" ^
  --location=us-east4

```

```shell
gcloud workflows run phl-assessments-data-pipeline ^
  --location=us-east4