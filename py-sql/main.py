"""
features:
1. converts following types db metadata to a standard json dbschema
    - xlsx from information schema
    - csv from information schema
    - ddl extracted from db
2. defines database in sqlalchemy
3. generates erdiagram for this database
4. generates ddl for this database

setup:
pip install pandas openpyxl simple_ddl_parser eralchemy graphviz

sqlalchemy column attributes:
    #{'key': '', 'name': '', 'table': None, 'type': String(length='38'), 'is_literal': False, 'primary_key': False, '_insert_sentinel': False, '_omit_from_statements': False, 
    # '_user_defined_nullable': <SchemaCons{'key': '', 'name': '', 'table': None, 'type': String(length='38'), 'is_literal': False, 'primary_key': False, '_insert_sentinel': False, 
    # '_omit_from_statements': False, '_user_defined_nullable': <SchemaConst.NULL_UNSPECIFIED: 3>, 'nullable': True, 'index': None, 'unique': None, 'system': False, 'doc': None, 'autoincrement': 'auto', 
    # 'constraints': set(), 'foreign_keys': set(), 'comment': None, 'computed': None, 'identity': None, 'default': None, 'onupdate': None, 'server_default': None, 'server_onupdate': None, '_creation_order': 1}

known issue: values for some fields are not split to array, compared to json library [simple_ddl_parser]. 
            Fields like identity, size etc
    ForeignKey from ddl is json object, not reproduced in er schema. need more work to read fk from object.
"""

import numpy as np
import pandas as pd
import json
from simple_ddl_parser import DDLParser
from sqlalchemy import MetaData
from sqlalchemy import Integer, String, Column, Table, DateTime, Numeric, Enum, ForeignKey
import sqlalchemy as sa
from eralchemy import render_er

#in files
_in_schema_file = "dbschema.sql"
#out files
_out_ddl = "_sqlalchemy_ddl.sql"
_out_schema_jsonfile = "_dbschema.json"
_out_schema_erfile = "_erdiagram.png"

DB_DIALECT = "mssql"
DB_URL= "sqlite+pysqlite:///:memory:"
_TABLE_ATTRIBUTES = ['table_name','schema','primary_key','alter','checks','index','partitioned_by','tablespace','external','primary_key_enforced','clone']
_COLUMN_ATTRIBUTES = ['name','type','size','identity','references','unique','nullable','default','check','is_primary_key']  #'is_primary_key' is not a part of standard definition
_SORT_ATTRIBUTES = ['schema', 'table_name', 'ordinal_position']

metadata_object=MetaData()
engine = sa.create_engine(DB_URL, echo=False, future=True)

def loadDatabaseFromSource(_metadata_object):
    _json_object = None
    if (_in_schema_file.lower().endswith(".xlsx")):
        print(f"Reading from excel file {_in_schema_file}.\nExpecting metadata columns..", _TABLE_ATTRIBUTES, _COLUMN_ATTRIBUTES)
        input("Proceed?")
        _df_metadata = pd.read_excel(_in_schema_file, index_col=None, keep_default_na=False)
        _df_metadata = normalizeDbSchemaDataframe(_df_metadata)
        _json_object = json.dumps(infoSchemaToJson(_df_metadata))        
    """if (_in_schema_file.lower().endswith(".csv")):
        print(f"Reading from csv file {_in_schema_file}.\nExpecting metadata columns..", _TABLE_ATTRIBUTES, _COLUMN_ATTRIBUTES)
        input("Proceed?")
        _df_metadata = pd.read_csv(_in_schema_file)
        _json_object = json.dumps(infoSchemaToJson(_df_metadata))"""
    if (_in_schema_file.lower().endswith(".sql")):
        print(f"Reading from ddl file {_in_schema_file}")
        input("Proceed?")        
        file = open(_in_schema_file, "r")
        _ddl = file.read()        
        _json_object = json.dumps(ddlToJson(_ddl))

    #--// dump json dbschema to file //------------------------------------
    writeFile(_out_schema_jsonfile, _json_object)

    #--// get table metadata from json //----------------------------------
    _df_schema = pd.json_normalize(json.loads(_json_object))

    for _ix, _table in _df_schema.iterrows():
        if isinstance(_table['table_name'], str):
            _cols = getColumnDefinition(_table['table_name'], _table['primary_key'], _table['columns'])
            _tab = Table(
                _table['table_name'],
                _metadata_object,
                *_cols
            )
        
        #--// debug col definition 
        #for _c in _cols:
        #    print(_c.__dict__)

    #--// dump sqlalchemy ddl to file //------------------------------------
    dump_ddl_to_file(DB_URL, _out_ddl, _metadata_object)
    return

def normalizeDbSchemaDataframe(_df_metadata:pd.DataFrame):
    """
    normalize size field. make it of format 
    - "size":[1,2]
    - "identity":[1,1]
    - "reference": [{}]
    """
    _df_metadata.columns = [x.lower() for x in _df_metadata.columns]
    _schema_name = _df_metadata['schema'][0]    #allows only one schema for now
    _df_metadata['size'] = _df_metadata['size'].apply(lambda x: np.fromstring(str(x).replace('(', '').replace(')', '').replace('[', '').replace(']', ''), dtype=int, sep=","))
    _df_metadata['identity'] = _df_metadata['identity'].apply(lambda x: np.fromstring(str(x).lower().replace('identity', '').replace('(', '').replace(')', '').replace('[', '').replace(']', ''), dtype=int, sep=","))
    _df_metadata['nullable'] = _df_metadata['nullable'].apply(lambda x: bool(str(x).lower().replace('yes', 'true').replace('no', 'false').replace('0', 'false').replace('1', 'true')))
    _df_metadata['references'] = _df_metadata['references'].apply(lambda x: x.replace(_schema_name + '.', ''))
    _df_metadata['is_primary_key'] = _df_metadata['is_primary_key'].apply(lambda x: bool(str(x).lower().replace('yes', 'true').replace('no', 'false').replace('0', 'false').replace('1', 'true')))
    return _df_metadata

def getColumnDefinition(_table_name:str, _pk_list, _cols_json:str):
    """
    translate col metadata to sqlalchemy compatible types based on dialect
    """
    _cols = []
    for _col in _cols_json:
        _col_normalized = normalizeColumnDefinition(_table_name, _pk_list, _col, DB_DIALECT)
        _cols.append(_col_normalized)
    return _cols

def normalizeColumnDefinition(_table_name, _pk_list, _col, _db_dialect):
    """
    normalize datatypes based on dialect
    return sqlalchemy Column object collection
        #sqlalchemy column attributes:
        #{'key': 'ACTION_DEF_ID', 'name': 'ACTION_DEF_ID', 'table': None, 'type': String(length='38'), 'is_literal': False, 'primary_key': False, '_insert_sentinel': False, '_omit_from_statements': False, 
        # '_user_defined_nullable': <SchemaCons{'key': 'ACTION_DEF_ID', 'name': 'ACTION_DEF_ID', 'table': None, 'type': String(length='38'), 'is_literal': False, 'primary_key': False, '_insert_sentinel': False, 
        # '_omit_from_statements': False, '_user_defined_nullable': <SchemaConst.NULL_UNSPECIFIED: 3>, 'nullable': True, 'index': None, 'unique': None, 'system': False, 'doc': None, 'autoincrement': 'auto', 
        # 'constraints': set(), 'foreign_keys': set(), 'comment': None, 'computed': None, 'identity': None, 'default': None, 'onupdate': None, 'server_default': None, 'server_onupdate': None, '_creation_order': 1}
    """
    _col_name = _col['name']
    _col_normalized = None
    _col_type_normalized = None
    _col_size = None
    _col_size = [_col['size']] if not isinstance(_col['size'], list) else _col['size']
    _col_scale_normalized = int(_col_size[0]) if len(_col_size) == 1 and _col['size'] != None else None
    _col_precision_normalized = int(_col_size[1]) if len(_col_size)==2 and _col['size'] != None else None

    #set primary key, nullable
    _col_nullable = isTrue(_col['nullable'])
    _pk_list = _pk_list if isinstance(_pk_list, list) else []
    _col_primary_key = True if _col_name in _pk_list else False
    _col_foreign_key = _col['references']

    #normalize data type
    match _col['type'].upper():
        case "INT" | "INTEGER":
            _col_type_normalized = Integer
        case "TEXT":
            _col_type_normalized = String(_col_scale_normalized)
        case _:
            _col_type_normalized = String(_col_scale_normalized)
    if (_col_foreign_key):
        _col_normalized = Column(_col['name'], _col_type_normalized, ForeignKey(_col_foreign_key), primary_key=_col_primary_key, nullable=_col_nullable)
    else:
        _col_normalized = Column(_col['name'], _col_type_normalized, primary_key=_col_primary_key, nullable=_col_nullable)
    return _col_normalized

def isTrue(_expr:str) -> bool:
    try:
        return bool(int(str(_expr).lower().replace('false', '0').replace('no', '0').replace('true', '1').replace('yes', '1')))
    except ValueError:
        return False

def ddlToJson(_ddl:str) -> str:
    """
    takes input ddl
    converts it into json object
    saves json in a file
    """
    _json_object = DDLParser(_ddl).run(output_mode=DB_DIALECT)
    return _json_object

def infoSchemaToJson(_df_metadata:pd.DataFrame) -> str:
    """
    takes input metadata in the form of information_schema
    converts it into json object
    saves json in a file
    """
    _df_metadata.columns = [x.lower() for x in _df_metadata.columns]

    #--// find columns that exist in the file
    _group_columns = [_col for _col in _df_metadata.columns if _col.lower() in _TABLE_ATTRIBUTES]
    _value_columns = [_col for _col in _df_metadata.columns if _col.lower() in _COLUMN_ATTRIBUTES]
    _sort_columns = [_col for _col in _df_metadata.columns if _col.lower() in _SORT_ATTRIBUTES]

    _df_metadata = _df_metadata.sort_values(by=_sort_columns)
    _grouped_df = _df_metadata.groupby(_group_columns)[_value_columns].apply(lambda x: x.to_dict('records')).reset_index(name='columns')
    _grouped_pk_df = _df_metadata[_df_metadata["is_primary_key"]].groupby(["table_name"])[_value_columns].apply(lambda x: [",".join(x["name"])]).reset_index(name='primary_key')
    #print(_grouped_df[_grouped_df['table_name']=='CRITERIA_CHECK_LOG'])
    _grouped_df = _grouped_df.merge(_grouped_pk_df, how='left', left_on=["table_name"], right_on=["table_name"])
    
    _json_object = json.loads(_grouped_df.to_json(orient='records'))
    return _json_object

def writeFile(_filename:str, _json:str):
    """
    helper function to dump content to file
    """    
    with open(_filename, 'w') as f:
        json.dump(json.loads(_json), f, indent=4)
    return json.dumps(json.loads(_json))

def dump_ddl_to_file(url, filepath, metadata):
    """
    helper function to dump sqlalchemy ddl to file
    """
    with open(filepath, 'w') as f:
        #engine = sa.create_engine(url, strategy='mock', executor=lambda sql, *multiparams, **params: f.write(str(sql.compile(dialect=engine.dialect)) + ';\n'))
        engine = sa.create_mock_engine(url, executor=lambda sql, *multiparams, **params: f.write(str(sql.compile(dialect=engine.dialect)) + ';\n'))
        metadata.create_all(bind=engine)

if __name__ == "__main__":    
    loadDatabaseFromSource(metadata_object)
    metadata_object.create_all(engine)
    render_er(metadata_object, _out_schema_erfile)
