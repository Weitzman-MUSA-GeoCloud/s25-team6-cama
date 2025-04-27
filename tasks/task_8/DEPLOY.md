_run_current_year_tax_sql_:

```shell
gcloud functions deploy run_current_year_tax_sql ^
--gen2 ^
--region=us-east4 ^
--runtime=python312 ^
--source=. ^
--entry-point=run_current_year_tax_sql ^
--service-account=data-pipeline-user@musa5090s25-team6.iam.gserviceaccount.com ^
--memory=4Gi ^
--timeout=480s ^
--trigger-http ^
--no-allow-unauthenticated
```

```shell
gcloud functions call run_current_year_tax_sql ^
--region=us-east4
```

```querylink
"https://us-east4-musa5090s25-team6.cloudfunctions.net/run_sql?sql=create_derived_current_year_assessment_bins.sql"
```

```queryfunction
curl -X POST 'https://run-current-year-tax-sql-253794584465.us-east4.run.app?sql=create_derived_current_year_assessment_bins.sql' -H "Authorization: bearer $(gcloud auth print-identity-token)" -H "Content-Type: application/json"
```