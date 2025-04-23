"""
generate stt diagram (plantuml) from tabular metadata
"""
import os
import pandas as pd
import numpy as np
import json, re
from jinja2 import Template
import config

#--// input files declaration
_p_template_folder = config.template_folder
_p_schema_file = config.input_file

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
input(f"Rendering template '{_df_plantuml_template.key[int(_ui_option_index)]}' using data from '{_p_schema_file}'. Proceed?")

def main(_schema_file:str):
    _df_schema = read_schema(_schema_file)
    _reverse_col_mapping = {v: k for k, v in config.col_mapping.items()}
    _ls_column_standardized = list(map(lambda item: _reverse_col_mapping.get(item, item), _df_schema.columns))
    _df_schema.columns = _ls_column_standardized

    _df_schema_groups = _df_schema.groupby(config.group_by)
    for _group, _df_items in _df_schema_groups:
        if all(_group):
            _df_items = _df_items.sort_values(by=config.sort_by)
        _json_schema_array = _df_items.to_json(orient='records')
        print(render_plantuml(_str_template_value, _json_schema_array))
    return

def read_schema(_schema_file:str):
    _df_schema_info = pd.read_excel(_schema_file, index_col=None, keep_default_na=False)
    return _df_schema_info

def render_plantuml(_template, _data):
    _template_obj = Template(_template)
    _text_rendered = _template_obj.render(data = json.loads(_data))
    return(_text_rendered)

if __name__ == "__main__":    
    main(_p_schema_file)

