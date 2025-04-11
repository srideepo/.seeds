let erSchema = [{
    "name":"dim_transactions",
    "columns":[{
      "name":"transaction_id",
      "type":"varchar"
    },
    {
      "name":"transaction_type",
      "type":"varchar"
    },
    {
      "name":"transaction_purpose",
      "type":"varchar"
    }]
  },{
    "name":"dim_users",
    "columns":[{
      "name":"user_id",
      "type":"varchar"
    },
    {
      "name":"age_band",
      "type":"varchar"
    },
    {
      "name":"salary_band",
      "type":"varchar"
    },
    {
      "name":"postcode",
      "type":"varchar"
    },
    {
      "name":"LSOA",
      "type":"varchar"
    },
    {
      "name":"MSOA",
      "type":"varchar"
    },
    {
      "name":"derived_gender",
      "type":"varchar"
    }]
  },{
    "name":"dim_merchants",
    "columns":[{
      "name":"merchant_id",
      "type":"varchar"
    },
    {
      "name":"merchant_name",
      "type":"varchar"
    },
    {
      "name":"merchant_business_line",
      "type":"varchar"
    }]
  },{
    "name":"dim_dates",
    "columns":[{
      "name":"transaction_date",
      "type":"date"
    },
    {
      "name":"day_of_month",
      "type":"varchar"
    },
    {
      "name":"day_name",
      "type":"varchar"
    },
    {
      "name":"month_of_year",
      "type":"varchar"
    },
    {
      "name":"month_name",
      "type":"varchar"
    },
    {
      "name":"year",
      "type":"varchar"
    }]
  },{
    "name":"dim_accounts",
    "columns":[{
      "name":"account_id",
      "type":"varchar"
    },
    {
      "name":"bank_name",
      "type":"varchar"
    },
    {
      "name":"account_type",
      "type":"varchar"
    },
    {
      "name":"account_created_date",
      "type":"varchar"
    },
    {
      "name":"account_last_refreshed",
      "type":"varchar"
    }]
  },{
    "name":"fact_transactions",
    "columns":[{
      "name":"transaction_date",
      "type":"date",
      "related_type":"many:1",
      "related_to":"dim_dates.transaction_date"
    },
    {
      "name":"transaction_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_transactions.transaction_id"
    },
    {
      "name":"user_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_users.user_id"
    },
    {
      "name":"account_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_accounts.account_id"
    },
    {
      "name":"merchant_id",
      "type":"varchar",
      "related_type":"many:1",
      "related_to":"dim_merchants.merchant_id"
    },
    {
      "name":"amount",
      "type":"int"
    }]
  }];

 let erCoordinates = [
    {
        "name": "dim_transactions",
        "loc": {
            "x": "940px",
            "y": "162px"
        }
    },
    {
        "name": "dim_users",
        "loc": {
            "x": "1352px",
            "y": "276px"
        }
    },
    {
        "name": "dim_merchants",
        "loc": {
            "x": "514px",
            "y": "404px"
        }
    },
    {
        "name": "dim_dates",
        "loc": {
            "x": "1364px",
            "y": "54px"
        }
    },
    {
        "name": "dim_accounts",
        "loc": {
            "x": "908px",
            "y": "328px"
        }
    },
    {
        "name": "fact_transactions",
        "loc": {
            "x": "47px",
            "y": "150px"
        }
    }
];