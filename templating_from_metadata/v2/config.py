input_file = r"./input/dim_product_stt.xlsx"

template_folder = r'./templates'
col_mapping = dict(
    table_schema = 'TARGET_TABLE_SCHEMA',
    table_name = 'TARGET_TABLE_NAME',
    column_name = 'TARGET_COLUMN_NAME',
    data_type = 'TARGET_DATATYPE',
    nullable = 'TARGET_COLUMN_NULLABLE'
)
group_by = ['table_schema', 'table_name']
sort_by = ['column_name']
