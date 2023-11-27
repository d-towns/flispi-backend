import uuid
from sqlalchemy import Column, String, Float, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class PropertyEntity(Base):
    __tablename__ = 'properties'
    
    id = Column(String, primary_key=True, default=uuid.uuid4)  # new UUID field
    parcel_id = Column(String, unique=True)  # no longer a primary key, but still unique
    address = Column(String)
    city = Column(String)
    zip = Column(String)  # If zip codes can have leading zeroes or non-numeric characters, use String instead
    property_class = Column(String)
    price = Column(Integer)
    square_feet = Column(Integer)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    year_built = Column(String)
    lot_size = Column(Float)
    stories = Column(Integer)
    garage = Column(String)
    features = Column(JSON)
    featured = Column(Boolean, default=False)
    coords = Column(JSON)
    images = Column(JSON)


