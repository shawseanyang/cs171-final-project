# Data Descriptions

## onlyMay.csv

This file contains the flight data for the month of May 2022. It was derived from https://www.kaggle.com/datasets/dilwong/flightprices. We only kept the columns we needed. It contains the following columns:

searchDate: The date (YYYY-MM-DD) on which this entry was taken from Expedia.

flightDate: The date (YYYY-MM-DD) of the flight.

destinationAirport: Three-character IATA airport code for the arrival location.

travelDuration: The travel duration in hours and minutes.

isNonStop: Boolean for whether the flight is non-stop.

totalFare: The price of the ticket (in USD) including taxes and other fees.

totalTravelDistance: The total travel distance in miles. This data is sometimes missing.

segmentsAirlineName: String containing the name of the airline that services each leg of the trip. The entries for each of the legs are separated by '||'.

segmentsEquipmentDescription: String containing the type of airplane used for each leg of the trip (e.g. "Airbus A321" or "Boeing 737-800"). The entries for each of the legs are separated by '||'.

## airports.csv

This file contains a list of airports based on the airports in onlyMay.csv. Importantly, it contains the longitude and latitude of each airport so that they can be plotted on a map. It was derived from https://github.com/ip2location/ip2location-iata-icao. It contains the following columns:

airport: name of the airport.

iata: three-character IATA airport code.

latitude: latitude of the airport.

longitude: longitude of the airport.