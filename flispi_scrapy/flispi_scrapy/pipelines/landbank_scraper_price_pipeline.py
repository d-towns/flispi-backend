from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from flispi_scrapy.models.sql.property import PropertyEntity

import googlemaps

gmaps = googlemaps.Client(key='AIzaSyDNQz71iokW0F045lNGGa514dZj9PGhx6E')

class LandbankPriceScraperPipeline(object):
    def open_spider(self, spider):
        self.connection_string = "sqlite:///landbank_properties.db"
        self.engine = create_engine(self.connection_string)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    def close_spider(self, spider):
        self.session.close()

    def process_item(self, item, spider):
        # Find the property based on parcelId and update its price
        print('item in pipline', item)
        property_ = self.session.query(PropertyEntity).filter_by(parcel_id=item['parcel_id']).first()

        if property_.coords == None:
            print("coords", property_.coords)
            address = property_.address + ', ' + property_.city + ', ' + property_.zip
            print(address)
            geocode_result = gmaps.geocode(address)
            if geocode_result.__len__() != 0:
                print('geocode_result WAS FOUND', geocode_result[0]['geometry']['location'])
                if geocode_result.__len__() > 0:
                    property_.coords = geocode_result[0]['geometry']['location']
                else:
                    print('No geocode result for', address)
            else:
                print('geocode_result WAS NOT FOUND')
                print('No geocode result for', address)
        
        if property_:
            property_.price = item.get('price', None)
            property_.square_feet = item.get('square_feet', None)
            property_.bedrooms = item.get('bedrooms', None)
            property_.bathrooms = item.get('bathrooms', None)
            property_.year_built = item.get('year_built', None)
            property_.lot_size = item.get('lot_size', None)
            property_.stories = item.get('stories', None)
            property_.garage = item.get('garage', None)
            property_.features = item.get('features', None)
            property_.images = item.get('images', None)                                 
            self.session.commit()
        
        return item


