
from sqlalchemy import MetaData
from sqlalchemy import Integer, String, Column, Table, DateTime, Numeric, Enum, ForeignKey
import sqlalchemy as sa
import json
import pandas as pd
from eralchemy import render_er

metadata_object=MetaData()
json_file = 'dbschemaBkp.json'

_df = pd.read_json(json_file, typ='series')

def buildTable(table_def_json, _metadata_object):
    _table_def = table_def_json
    _table_name = _table_def['table_name']
    _table_schema = _table_def['schema']
    _primary_key = _table_def['primary_key']
    _foreign_key = {}
    _columns = []
    for _col in _table_def['columns']:
        _foreign_key = _col['references']
        #_columns.append(Column(_col['name'], _col['type'], primary_key=True if _col['name'] in _primary_key else False))
        if _foreign_key:
            _columns.append(Column(_col['name'], getDataType(_col['type'], _col['size']), ForeignKey(f"{_foreign_key['table']}.{_foreign_key['column']}"), primary_key=True if _col['name'] in _primary_key else False))
        else:
            _columns.append(Column(_col['name'], getDataType(_col['type'], _col['size']), primary_key=True if _col['name'] in _primary_key else False))
    return Table(
            _table_name,
            _metadata_object,
            *_columns
        )

def getDataType(dataType: str, size: str) -> str:
    match dataType.upper():
        case 'INT' | 'SMALLINT':
            return Integer
        case 'DECIMAL' | 'NUMERIC' | 'NUMBER' | 'MONEY':
            return Numeric(*size)            
        case 'DATETIME' | 'TIMESTAMP_NTZ':
            return DateTime
        case 'CHAR' | 'NCHAR' | 'NVARCHAR' | 'VARCHAR':
            return String(size)
        case _:
            return String(size)

for (_ix, _row) in _df.items():
    print(f"get definition for table[{_row['table_name']}]...")
    _table = buildTable(_row, metadata_object)
    print(f'complete table[{_table.name}]')

engine = sa.create_engine("sqlite+pysqlite:///:memory:",
					echo=True, future=True)
metadata_object.create_all(engine)


# Show ER model from here
filename = 'mymodel3.png'
render_er(metadata_object, filename)
#imgplot = plt.imshow(mpimg.imread(filename))
#plt.rcParams["figure.figsize"] = (15,10)
#plt.show()

