class SQLProperty {
    parcelId: string;
    address: string;
    city: string;
    zip: string;
    propertyClass: string;
    price: number;


    constructor(parcelId: string, address: string, city: string, zip: string, propertyClass: string, price: number) {
        this.parcelId = parcelId;
        this.address = address;
        this.city = city;
        this.zip = zip;
        this.propertyClass = propertyClass;
        this.price = price;

    }
}
