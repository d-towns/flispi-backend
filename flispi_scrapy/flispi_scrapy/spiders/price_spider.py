import scrapy

from ..models.sql.property import PropertyEntity
from ..models.scrapy.property import Property

import scrapy
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Scrapy Spider
class PriceSpider(scrapy.Spider):
    name = 'price_spider'

    def start_requests(self):
        self.connection_string = "sqlite:///landbank_properties.db"
        self.engine = create_engine(self.connection_string)
        Session = sessionmaker(bind=self.engine)
        session = Session()
        parcel_ids = [row.parcel_id for row in session.query(PropertyEntity.parcel_id).all() if row.parcel_id != '0' and row.parcel_id != 'None']
        session.close()
        # Test Url
        # yield scrapy.Request(url='https://www.thelandbank.org/property_sheet.asp?pid=0404300022&loc=2&from=main', 
        #     callback=self.parse,
        #     meta={'parcel_id': '0404300022'})
        for pid in parcel_ids:
            # Assuming parcelId is a unique identifier, construct the URL
            # https://www.thelandbank.org/property_sheet.asp?pid=0404300022&loc=2&from=main
            yield scrapy.Request(url='https://www.thelandbank.org/property_sheet.asp?pid=' + str(pid) + '&loc=2&from=main', 
                        callback=self.parse, 
                        meta={'parcel_id': pid})


    def parse(self, response):
        starting_price = response.xpath('//table[@class="infotab"]/tr[1]/td[2]/text()').get()

        link_selector = response.xpath("//a[contains(text(), 'featured')]/@href")
        property_item = Property()
        property_item['parcel_id'] = response.meta['parcel_id']

        print(property_item)

        if '$' in starting_price:
            starting_price = int(starting_price.replace('$', '').replace(',', '').strip())
            # Populate the Scrapy item
            print('price_row', starting_price)
            property_item['price'] = starting_price
        else:
            property_item['price'] = None


        # Extract the href attribute from the selected <a> tag
        link = link_selector.get()
        if(link):
            print('link', link)
            # Follow the link to the featured property page and grab more info
            yield scrapy.Request(url='https://www.thelandbank.org/' + link, callback=self.extract_featured_data, meta={'property_item': property_item})
        else:
            yield property_item


    def extract_featured_data(self, response):
        # Follow the link to the featured property page and grab more info
        # Select the div by class name, then the ul within it
        print('extract_featured_data', response)
        property_details = response.meta['property_item']
        property_details['featured'] = True
        property_info_list = response.xpath("//div[@class='2u 12u']/ul")
        suggested_offer_price = response.xpath("//h2[contains(text(), 'Starting Offer')]/text()").get()

        print('property_info_list', property_info_list)

        # Initialize a dictionary to hold the extracted property details

        if suggested_offer_price and 'negotiable' not in str(suggested_offer_price).lower():
            suggested_offer_price = int(suggested_offer_price.split(':')[1].replace(',', '').replace("$", "").strip())
            print('suggested_offer_price', suggested_offer_price)
            property_details['price'] = int(suggested_offer_price)

        carousel_div = response.xpath("//div[@class='bss-slides ccss1']/div")
        lightbox_a_tag = response.xpath("//a[@class='sslightbox']/@href")
        print('lightbox_a_tag', lightbox_a_tag) 

        for tag in lightbox_a_tag:
            image = tag.get()
            if image:
                if 'http' not in image:
                    image = 'https://www.thelandbank.org/' + image
                if 'images' not in property_details:
                    property_details['images'] = []
                property_details['images'].append(image)
                print ('IMAGE URLS', property_details['images'])

        for figure in carousel_div.xpath('./figure'):
            image = figure.xpath('./img/@src').get()
            if image:
                if 'http' not in image:
                    image = 'https://www.thelandbank.org/' + image
                if 'images' not in property_details:
                    property_details['images'] = []
                property_details['images'].append(image)
                print ('IMAGE URLS', property_details['images'])


        property_features = {}

        # Iterate over all the li tags within the ul
        for li in property_info_list.xpath('./li'):
            # Extract the text content of each li tag
            text = li.xpath('normalize-space(.)').get()

            # Check for specific keywords and extract the data
            if 'Square feet:' in text:
                property_details['square_feet'] = int(text.split('Square feet:')[1].strip())
            elif 'Bedrooms' in text:
                property_details['bedrooms'] = int(text.split('Bedrooms')[0].strip())
            elif 'Bathrooms' in text:
                property_details['bathrooms'] = int(text.split('Bathrooms')[0].strip())
            elif 'Year built:' in text:
                property_details['year_built'] = text.split('Year built:')[1].strip()
            elif 'Acres' in text:
                property_details['lot_size'] = float(text.split('Acres')[0].strip())
            elif 'Stories:' in text:
                property_details['stories'] = int(text.split('Stories')[0].strip())
            elif 'Garage' in text:
                property_details['garage'] = text.split('Garage')[0].strip()
            else:
                property_features[text] = True
        
        yield property_details

