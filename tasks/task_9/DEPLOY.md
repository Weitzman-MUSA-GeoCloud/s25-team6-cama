## Deploying

_run_sql:

```shell
gcloud functions deploy prepare_model_training_data ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=run_sql ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=8Gi ^
--timeout=3600s ^
--trigger-http 

```


```shell
gcloud functions call prepare_model_training_data ^
--region=us-east4 

```
gcloud functions call generate-assessment-chart-configs ^
--region=us-central1