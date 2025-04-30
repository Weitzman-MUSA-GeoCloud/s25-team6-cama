CREATE OR REPLACE TABLE `musa5090s25-team6.derived.current_assessments_model_training_data` AS (

SELECT 

  CAST(main.sale_price AS NUMERIC) AS sale_price,
  SUBSTR(main.sale_date, 1, 4) AS sale_year,
     IFNULL(NULLIF(main.basements, ""), "NA") AS basements,
        IFNULL(NULLIF(main.building_code, ""), "NA") AS building_code,
        IFNULL(NULLIF(main.zip_code, ""), "NA") AS zip_code,
        IFNULL(NULLIF(main.number_of_bathrooms, ""), "NA") AS number_of_bathrooms,
        IFNULL(NULLIF(main.number_of_bedrooms, ""), "NA") AS number_of_bedrooms,
        IFNULL(NULLIF(main.number_stories, ""), "NA") AS number_stories,
        IFNULL(NULLIF(main.year_built, ""), "NA") AS year_built,
        IFNULL(NULLIF(main.property_id, ""), "NA") AS property_id,
        IFNULL(NULLIF(main.market_value, ""), "NA") AS market_value,
        IFNULL(NULLIF(main.total_livable_area, ""), "NA") AS total_livable_area,
        IFNULL(NULLIF(main.garage_spaces, ""), "NA") AS garage_spaces,
        IFNULL(NULLIF(main.depth, ""), "NA") AS depth,
        IFNULL(NULLIF(main.category_code_description, ""), "NA") AS category_code_description,
        IFNULL(NULLIF(main.interior_condition, ""), "NA") AS interior_condition





FROM(
  SELECT*,
  ROW_NUMBER() OVER(
    PARTITION BY property_id
    ORDER BY sale_date DESC
  ) AS row_num

  FROM `musa5090s25-team6.core.opa_properties` 
  WHERE sale_price IS NOT NULL
  AND sale_price !=""
  AND safe_cast(sale_price AS NUMERIC)>1000
  ) AS main 
 LEFT JOIN (
    SELECT sale_price, sale_date
    FROM `musa5090s25-team6.core.opa_properties`
    WHERE sale_price IS NOT NULL AND sale_date IS NOT NULL
        GROUP BY sale_price, sale_date
        HAVING COUNT(*) > 1
 ) AS dup
    ON main.sale_price = dup.sale_price AND main.sale_date = dup.sale_date
    WHERE main.row_num = 1 AND dup.sale_price IS NULL
);