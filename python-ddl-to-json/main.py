"""
https://pypi.org/project/simple-ddl-parser/
[‘redshift’, ‘spark_sql’, ‘mysql’, ‘bigquery’, ‘mssql’, ‘databricks’, ‘sqlite’, ‘vertics’, ‘ibm_db2’, ‘postgres’, ‘oracle’, ‘hql’, ‘snowflake’, ‘sql’]
#output from DDLParser is a dict and needs to be cleaned up to a valid json
#   replace singlequote with doublequote
#   replace None with null
#   replace True to true
#   replace False to false
#   replace (1, 1) values to string
"""

from simple_ddl_parser import DDLParser
import json

db_dialect = 'hql'
ddl_file = 'dbschema.sql'
json_file = 'dbschema.json'

ddl = """
    CREATE TABLE IF NOT EXISTS default.salesorder(
        SalesOrderID int,
        OrderQty int
        )
    PARTITIONED BY (batch_id int, batch_id2 string, batch_32 some_type)
    LOCATION 's3://datalake/table_name/v1'
    ROW FORMAT DELIMITED
        FIELDS TERMINATED BY ','
        COLLECTION ITEMS TERMINATED BY '\002'
        MAP KEYS TERMINATED BY '\003'
    STORED AS TEXTFILE;

    CREATE TABLE IF NOT EXISTS default.salesorderdetail(
        SalesOrderDetailID int,
        SalesOrderID int,
        ProductID int,
        OrderQty int,
        LineTotal decimal,
        CONSTRAINT salesorderdetail_fk_1 FOREIGN KEY (SalesOrderID) REFERENCES salesorder (SalesOrderID)       
        )
    PARTITIONED BY (batch_id int, batch_id2 string, batch_32 some_type)
    LOCATION 's3://datalake/table_name/v1'
    ROW FORMAT DELIMITED
        FIELDS TERMINATED BY ','
        COLLECTION ITEMS TERMINATED BY '\002'
        MAP KEYS TERMINATED BY '\003'
    STORED AS TEXTFILE;

"""

# read ddl from file
#file = open(ddl_file, "r")
#ddl = file.read()

result = DDLParser(ddl).run(output_mode=db_dialect)

result_json = json.dumps(result, indent=4)

# Writing json result to file
with open(json_file, "w") as file:
    file.write(result_json)

print(result_json)

