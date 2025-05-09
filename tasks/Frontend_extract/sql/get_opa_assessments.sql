SELECT 
   main.property_id AS property_id,
   main.year AS tax_year,
   main.market_value AS market_value,
   main.taxable_land AS taxable_land,
   main.taxable_building AS taxable_building,
   main.exempt_building AS exempt_building,
   main.exempt_land AS exempt_land 

 FROM `musa5090s25-team6.core.opa_assessments` as main
 
WHERE main.property_id = {property_id};

 