"""
generate stt diagram (plantuml) from tabular metadata
"""
import os
import pandas as pd
import json, re
from jinja2 import Template

#--// input files declaration
_p_template_folder = r'./templates'
_p_schema_file = r"./input/dim_product.xlsx"
_p_header_standard_file = r"./input/header_standardized.json"

#--// prompt 1 user picks a template
_files_in_dir = os.listdir(_p_template_folder)
print(_files_in_dir)
_ui_index_template = input("Found these templates, provide 0 indexed option of template to use:")
_IN_TEXT_TEMPLATE_NAME = os.path.join(_p_template_folder, _files_in_dir[int(_ui_index_template)])
print(f'reading template {_IN_TEXT_TEMPLATE_NAME}....')

#--// prompt 2 user picks an action
_df_plantuml_template = pd.read_csv(_IN_TEXT_TEMPLATE_NAME, sep='|', names=["key","value"], header=None)

print(_df_plantuml_template)
_ui_option_index = input("Provide index of option:")
_str_template_value = _df_plantuml_template.value[int(_ui_option_index)]

_RE_HEADER_NONALPANUMERIC = r"[_ \[\]]"

input(f"Rendering template '{_df_plantuml_template.key[int(_ui_option_index)]}' using data from '{_p_schema_file}'. Proceed?")

def main(_schema_file:str):
    _df_schema = read_schema(_schema_file)
    _sr_headers = pd.read_json(_p_header_standard_file, typ="series")
    _ls_column_standardized = standardize_list(_df_schema.columns, _sr_headers)
    _df_schema.columns = _ls_column_standardized
    _json_schema_array = _df_schema.to_json(orient='records')
    print(render_plantuml(_str_template_value, _json_schema_array))

def standardize_list(_ls_list_orig:list, _dict_values_standard:dict):
    _ls_list_orig = [re.sub(_RE_HEADER_NONALPANUMERIC, "", _col_name).lower() for _col_name in _ls_list_orig]
    _ls_list_standardized = list(map(lambda x: _dict_values_standard.get(x.lower(), x), _ls_list_orig))
    return _ls_list_standardized

def read_schema(_schema_file:str):
    _df_schema_info = pd.read_excel(_schema_file, index_col=None, keep_default_na=False)
    return _df_schema_info

def render_plantuml(_template, _data):
    _template_obj = Template(_template)
    _text_rendered = _template_obj.render(data = json.loads(_data))
    return(_text_rendered)

if __name__ == "__main__":    
    main(_p_schema_file)

