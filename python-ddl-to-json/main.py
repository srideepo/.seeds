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
import pandas as pd

db_dialect = 'mssql'
ddl_file = 'dbschema.sql'
json_file = 'dbschema.json'
metadata_excel = 'DBSchema.xlsx'

def metadata_to_ddl(_metadata_excel) -> str:
    _ddl = ''
    _prefix = ''
    _PREFIX_COMMA = ','
    _df_metadata = pd.read_excel(_metadata_excel, index_col=None, keep_default_na=False)
    _df_metadata = _df_metadata.sort_values(by=['TABLE_SCHEMA', 'TABLE_NAME', 'ORDINAL_POSITION'])
    _ddl += f"CREATE TABLE {_df_metadata.loc[0]['TABLE_SCHEMA']}.{_df_metadata.loc[0]['TABLE_NAME']}(\n"
    for (_ix, _row) in _df_metadata.iterrows():
        if _ix > 0 and _df_metadata.loc[_ix-1]['TABLE_NAME'] != _row['TABLE_NAME']:
            _ddl += f");\nCREATE TABLE {_row['TABLE_SCHEMA']}.{_row['TABLE_NAME']}(\n"
            _prefix = ''
        _ddl += f"\t{_prefix}{_row['COLUMN_NAME']} {_row['DATA_TYPE']}{'' if len(str(_row['COLUMN_SIZE']))==0 else ''.join(['(', str(_row['COLUMN_SIZE']), ')']) } {_row['IDENTITY_DEFINITION']}{' NULL' if _row['IS_NULLABLE'].upper() == 'YES' else ' NOT NULL'} {'' if len(str(_row['COLUMN_DEFAULT']))==0 else ''.join([' DEFAULT(', str(_row['COLUMN_DEFAULT']), ')'])}\n"
        _prefix = _PREFIX_COMMA
    _ddl += ');'
    print(_ddl)
    return _ddl

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
ddl = metadata_to_ddl(metadata_excel)

result = DDLParser(ddl).run(output_mode=db_dialect)
print(result)
result_json = json.dumps(result, indent=4)

# Writing json result to file
with open(json_file, "w") as file:
    file.write(result_json)

print(result_json)

