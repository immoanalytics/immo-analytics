--generate avg_price_rentals.xml
--replace DATA_RECORD with dataset
  SELECT postal_code "postalcode",
         TRUNC (posted, 'MM') "posted",
         TRUNC (AVG (price)) "averageprice",
         COUNT (id) "nbrentals"
    FROM v_immo_rent
   WHERE TRUNC (posted, 'MM') >= TRUNC (ADD_MONTHS (SYSDATE, -6), 'MM') AND TRUNC (posted, 'MM') < TRUNC (SYSDATE, 'MM')
GROUP BY postal_code, TRUNC (posted, 'MM')
  HAVING COUNT (id) > 1
ORDER BY 1, 2, 4 DESC;

--generate avg_score_rentals.xml
--replace DATA_RECORD with dataset
  SELECT postal_code "postalcode",
         TRUNC (AVG ("avglivingarea")) "avglivingarea",
         TRUNC (AVG ("avgland")) "avgland",
         TRUNC (AVG ("avgbedrooms"), 1) "avgbedrooms",
         TRUNC (AVG ("avgrentalprice")) "avgrentalprice",
         TRUNC (AVG ("avgsalesprice")) "avgsalesprice",
         COUNT (*) "count"
    FROM (SELECT postal_code,
                 TRUNC (living_area) "avglivingarea",
                 TRUNC (land) "avgland",
                 TRUNC (bedrooms) "avgbedrooms",
                 TRUNC (price) "avgrentalprice",
                 NULL "avgsalesprice"
            FROM v_immo_rent
          UNION
          SELECT postal_code,
                 TRUNC (living_area) "avglivingarea",
                 TRUNC (land) "avgland",
                 TRUNC (bedrooms) "avgbedrooms",
                 NULL "avgrentalprice",
                 TRUNC (price) "avgsalesprice"
            FROM v_immo_sale)
GROUP BY postal_code
  HAVING COUNT (*) > 20;
  
--generate count_totals.xml
--replace DATA_RECORD with dataset
with rentals as (
select postal_code, LOAD_ZIPCODES.COMMUNE, type, count(distinct id) count_rentals
from v_immo_rent, LOAD_ZIPCODES
where V_IMMO_RENT.POSTAL_CODE = LOAD_ZIPCODES.CODE_POSTAL (+)
group by postal_code, LOAD_ZIPCODES.COMMUNE, type
), sales as (
select postal_code, LOAD_ZIPCODES.COMMUNE, type, count(distinct id) count_sales
from v_immo_sale, LOAD_ZIPCODES
where v_immo_sale.POSTAL_CODE = LOAD_ZIPCODES.CODE_POSTAL (+)
group by postal_code, LOAD_ZIPCODES.COMMUNE, type
) select nvl(sales.postal_code, rentals.postal_code) postalcode, nvl(sales.commune, rentals.commune) commune,
    nvl(sales.type, rentals.type) type, nvl(count_rentals, 0) count_rentals, nvl(count_sales, 0) count_sales, nvl(count_rentals+count_sales,0) count_totals
 from rentals full outer join sales on (rentals.postal_code = sales.postal_code and rentals.type = sales.type)
 where nvl(count_rentals+count_sales,0) > 0
order by 1 ;