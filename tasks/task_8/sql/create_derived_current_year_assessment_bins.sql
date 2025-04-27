CREATE OR REPLACE TABLE derived.current_assessment_bins AS
WITH yearly_ranges AS (
  SELECT
    CAST(year AS INT64) AS tax_year,
    MIN(market_value) AS min_value,
    MAX(market_value) AS max_value
  FROM `musa5090s25-team6.source.opa_assessments`
  WHERE market_value IS NOT NULL 
    AND market_value > 0
    AND CAST(year AS INT64) = 2025
  GROUP BY tax_year
),

bins AS (
  SELECT
    tax_year,
    min_value + (n-1) * ((max_value - min_value)/10) AS lower_bound,
    min_value + n * ((max_value - min_value)/10) AS upper_bound,
    n AS bin_num
  FROM yearly_ranges
  CROSS JOIN UNNEST(GENERATE_ARRAY(1, 10)) AS n
),

property_counts AS (
  SELECT
    b.tax_year,
    b.lower_bound,
    b.upper_bound,
    COUNT(a.market_value) AS property_count
  FROM bins b
  LEFT JOIN `musa5090s25-team6.source.opa_assessments` a
    ON CAST(a.year AS INT64) = b.tax_year
    AND a.market_value >= b.lower_bound
    AND (a.market_value < b.upper_bound OR 
        (b.bin_num = 10 AND a.market_value <= b.upper_bound))
  GROUP BY b.tax_year, b.lower_bound, b.upper_bound
)

SELECT
  tax_year,
  CAST(lower_bound AS INT64) AS lower_bound,
  CAST(upper_bound AS INT64) AS upper_bound,
  property_count
FROM property_counts
ORDER BY tax_year, lower_bound;