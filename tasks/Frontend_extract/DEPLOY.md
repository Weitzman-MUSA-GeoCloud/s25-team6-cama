## Deploying

_run_sql:

```shell
gcloud functions deploy request_files ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=get_data ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=8Gi ^
--timeout=3600s ^
--trigger-http 
--allow-unauthenticated

```


```shell
gcloud functions call prepare_model_training_data ^
--region=us-east4 
```