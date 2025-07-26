let erSchemaDict = {
    "dim_transactions":[{      
      "name":"transaction_id",
      "type":"varchar",
      "iskey":"pk"
    },{
      "name":"transaction_type",
      "type":"varchar"
    },{
      "name":"transaction_purpose",
      "type":"varchar"
    }],
    "dim_users":[{
      "name":"user_id",
      "type":"varchar",
      "iskey":"pk"
    },{
      "name":"age_band",
      "type":"varchar"
    },{
      "name":"salary_band",
      "type":"varchar"
    },{
      "name":"postcode",
      "type":"varchar"
    },{
      "name":"LSOA",
      "type":"varchar"
    },{
      "name":"MSOA",
      "type":"varchar"
    },{
      "name":"derived_gender",
      "type":"varchar"
    }],
    "dim_merchants":[{
      "name":"merchant_id",
      "type":"varchar",
      "iskey":"pk"
    },{
      "name":"merchant_name",
      "type":"varchar"
    },{
      "name":"merchant_business_line",
      "type":"varchar"
    }],
    "dim_dates":[{
      "name":"transaction_date",
      "type":"date",
      "iskey":"pk"
    },{
      "name":"day_of_month",
      "type":"varchar"
    },{
      "name":"day_name",
      "type":"varchar"
    },{
      "name":"month_of_year",
      "type":"varchar"
    },{
      "name":"month_name",
      "type":"varchar"
    },{
      "name":"year",
      "type":"varchar"
    }],
    "dim_accounts":[{
      "name":"account_id",
      "type":"varchar",
      "iskey":"pk"
    },{
      "name":"bank_name",
      "type":"varchar"
    },{
      "name":"account_type",
      "type":"varchar"
    },{
      "name":"account_created_date",
      "type":"varchar"
    },{
      "name":"account_last_refreshed",
      "type":"varchar"
    }],
    "fact_transactions":[{
      "name":"transaction_date",
      "type":"date",
      "related_type":"many:1",
      "related_to":"dim_dates.transaction_date",
      "iskey":"pk"
    },{
      "name":"transaction_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_transactions.transaction_id",
      "iskey":"fk"
    },{
      "name":"user_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_users.user_id",
      "iskey":"fk"
    },{
      "name":"account_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_accounts.account_id",
      "iskey":"fk"
    },{
      "name":"merchant_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_merchants.merchant_id",
      "iskey":"fk"
    },{
      "name":"amount",
      "type":"int"
    }]
};

let erCoordinatesDict = {
    "dim_transactions": {
        "x": "940px",
        "y": "162px"
    },
    "dim_users": {
        "x": "1352px",
        "y": "276px"
    },
    "dim_merchants": {
        "x": "514px",
        "y": "404px"
    },
    "dim_dates": {
        "x": "1364px",
        "y": "54px"
    },
    "dim_accounts": {
        "x": "908px",
        "y": "328px"
    },
    "fact_transactions": {
        "x": "190px",
        "y": "134px"
    }
};