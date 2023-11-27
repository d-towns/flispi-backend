import pandas as pd
from sqlalchemy import create_engine
import sqlite3
import uuid

from ..models.scrapy.property import Property

class LandbankScraperPipeline(object):
    def __init__(self):
        self.connection_string = 'sqlite:///landbank_properties.db'
        self.engine = create_engine(self.connection_string)

    def process_item(self, item, spider):
        if isinstance(item, Property):
            df = pd.DataFrame({
                'id': [str(uuid.uuid4())], # new UUID field
                'parcel_id': [item['parcel_id']], # remove spaces from parcelId
                'address': [item['address']],
                'city': [item['city']],
                'zip': [item['zip']],
                'property_class': [item['property_class']],
                'featured' : False,
                'price': None,
                'square_feet': None,
                'bedrooms': None,
                'bathrooms': None,
                'year_built': None,
                'lot_size': None,
                'stories': None,
                'garage': None,
                'features': None,
                'coords': None
            })
            df.to_sql('properties', self.engine, if_exists='append', index=False)
        return item