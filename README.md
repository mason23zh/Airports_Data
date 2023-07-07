# Flight Data

## This is an API to get data for the airports, runways, METARs and etc.

### Base URL: https://flight-data.herokuapp.com/api/v1

---

- [Flight Data](#flight-data)
    - [METAR](#metar)
        - [Get METAR using ICAO code](#get-metar-using-icao-code)
        - [Get metar within radius by ICAO](#get-metar-within-radius-by-icao)
        - [Get metar within radius by longitude and latitude](#get-metar-within-radius-by-longtitude-and-latitude)
        - [Get nearest METAR by ICAO](#get-nearest-metar-by-icao)
        - [Get nearest METAR by longitude and latitude](#get-nearest-metar-by-longtitude-and-latitude)
        - [Get metar by airport name](#get-metar-by-airport-name)
        - [Get metar by generic input](#get-metar-by-geneirc-input)
    - [Weather Category](#weather)
        - **_Country Scope_**
            - [Get METARs for country sorted by temperature](#get-metars-for-country-sorted-by-temperature)
            - [Get METARs for country sorted by visibility](#get-metars-for-country-sorted-by-visibility)
            - [Get METARs for country sorted by barometer](#get-metars-for-country-sorted-by-barometer)
            - [Get METARs for country sorted by wind gust speed](#get-metars-for-country-sorted-by-wind-gust-speed)
            - [Get METARs for country sorted by wind gust speed](#get-metars-for-country-sorted-by-wind-gust-speed-1)
            - [Get METARs for country sorted by wind speed](#get-metars-for-country-sorted-by-wind-speed)
        - **_Continent Scope_**
            - [Get METARs for continent sorted by temperature](#get-metars-for-continent-sorted-by-temperature)
            - [Get METARs for continent sorted by visibility](#get-metars-for-continent-sorted-by-visibility)
            - [Get METARs for continent sorted by barometer](#get-metars-for-continent-sorted-by-barometer)
            - [Get METARs for continent sorted by wind gust speed](#get-metars-for-continent-sorted-by-wind-gust-speed)
            - [Get METARs for continent sorted by wind speed](#get-metars-for-continent-sorted-by-wind-speed)
        - **_Global Scope_**
            - [Get METARs for global sorted by temperature](#get-metars-for-global-sorted-by-temperature)
            - [Get METARs for global sorted by visibility](#get-metars-for-global-sorted-by-visibility)
            - [Get METARs for global sorted by barometer](#get-metars-for-global-sorted-by-barometer)
            - [Get METARs for global sorted by wind gust speed](#get-metars-for-global-sorted-by-wind-gust-speed)
            - [Get METARs for global sorted by wind speed](#get-metars-for-global-sorted-by-wind-speed)
        - [**_METAR Search_**](#metar-search)
        - [Search METAR for ICAO code](#search-metar-for-icao-code)
        - [Search METAR for IATA code](#search-metar-for-iata-code)
        - [Search METAR for airport's name](#search-metar-for-airports-name)
        - [Search METAR based on the geneirc input](#search-metar-based-on-the-geneirc-input)
    - [Airports](#airports)
        - [Get Airport data using ICAO](#get-airport-data-using-icao)
        - [Get Airport data using iata](#get-airport-data-using-iata)
        - [Get Airport data using city name](#get-airport-data-using-city-name)
        - [Get Airport data using geneirc info](#get-airport-data-using-geneirc-info)
        - [Get Airport data within radius of ICAO](#get-airport-data-within-radius-of-icao)
        - [Get distance from origin airport to destination airport](#get-distance-from-origin-airport-to-destination-airport)
        - [References:](#references)
        - [Credits](#credits)

---

## METAR

### Get METAR using ICAO code

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| icao           | A single or multiple ICAO codes (Max Number: 30) |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |

    GET /metar/get-metar/:icao

```bat
# Single ICAO
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/cywg

# Single ICAO decoded
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/cywg?decode=true

# Multiple ICAOs
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/cywg,klas,zspd

# Multiple ICAOs decoded
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/klax,cyvr,cyyz?decode=true
```

---

### Get metar within radius by ICAO

| URL Parameters | Description        |
| -------------- | ------------------ |
| icao           | A single ICAO code |

| URL Queries | Type    | Description                                                                 | Default |
| ----------- | ------- | --------------------------------------------------------------------------- | ------- |
| distance    | number  | The surrounding radius from the ICAO code                                   | 50      |
| unit        | string  | mile, miles, mi, kilometer, kilometers, km, nauticalmile, nauticalmiles, nm | mile    |
| decode      | boolean | return decoded METAR or raw text                                            | false   |

    GET /metar/get-metar/radius/:icao

```bat
# Get all METARs within 50 miles from CYWG
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/radius/cywg?distance=50&unit=mile&decode=true
```

---

### Get metar within radius by longtitude and latitude

| URL Parameters | Description                               |
| -------------- | ----------------------------------------- |
| coordinates    | longtitude and latitude followed by comma |

| URL Queries | Type    | Description                                                                 | Default |
| ----------- | ------- | --------------------------------------------------------------------------- | ------- |
| distance    | number  | The surrounding radius from the target coordinates                          | 50      |
| unit        | string  | mile, miles, mi, kilometer, kilometers, km, nauticalmile, nauticalmiles, nm | mile    |
| decode      | boolean | return decoded METAR or raw text                                            | false   |

    GET /get-metar/radius/coordinates/:coordinates

```bat
# Get all METARs within 50 miles from -97.5 49.9
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/radius/coordinates/-97.5,49.9
```

---

### Get nearest METAR by ICAO

| URL Parameters | Description        |
| -------------- | ------------------ |
| icao           | A single ICAO code |

| URL Queries | Type    | Description                      | Default |
| ----------- | ------- | -------------------------------- | ------- |
| decode      | boolean | return decoded METAR or raw text | false   |

    GET /metar/get-metar/radius/nearest/:icao

```bat
# Get nearest METAR from KBOS
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/nearest/KBOS
```

---

### Get nearest METAR by longtitude and latitude

| URL Parameters | Description                               |
| -------------- | ----------------------------------------- |
| coordinates    | longtitude and latitude followed by comma |

| URL Queries | Type    | Description                      | Default |
| ----------- | ------- | -------------------------------- | ------- |
| decode      | boolean | return decoded METAR or raw text | false   |

    GET /get-metar/radius/nearest/coordinates/:coordinates

```bat
# Get nearest METAR from -97.5 49.9
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/nearest/coordinates/-97.5,49.9
```

---

### Get metar by airport name

| URL Parameters | Description        |
| -------------- | ------------------ |
| name           | Airport name |

| URL Queries | Type    | Description                                                                 | Default |
| ----------- | ------- | --------------------------------------------------------------------------- | ------- |
| decode      | boolean | return decoded METAR or raw text                                            | false   |

    GET /metar/get-metar/name/:name

```bat
# Get METAR for airport's name that includ 'winnipeg'
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/name/winnipeg
# Get decoded METAR for aiport's name that include 'boston'
$ curl https://flight-data.herokuapp.com/api/vi/get-metar/name/boston?decode=true
```

---

### Get metar by geneirc input

| URL Parameters | Description        |
| -------------- | ------------------ |
| data           | A generic serch input |

| URL Queries | Type    | Description                                                                 | Default |
| ----------- | ------- | --------------------------------------------------------------------------- | ------- |
| decode      | boolean | return decoded METAR or raw text                                            | false   |

    GET /metar/get-metar/generic/:data

```bat
# Get METAR for airport's name that includ 'winnipeg' and location in 'winnipeg'
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/generic/winnipeg
# Get decoded METAR for aiport's name that include 'new york' and location in 'new york'
$ curl https://flight-data.herokuapp.com/api/v1/metar/get-metar/generic/new york?decode=true
```

---

## response

### Single standard METAR

```yaml
{
    "results": 1,
    "data":
      [
          "CYVR 090200Z 15006KT 20SM FEW100 FEW230 23/10 A2986 RMK AC1CI2 AC TR CONTRAILS SLP115 DENSITY ALT 1000FT",
      ],
}
```

### Single decoded METAR

```yaml
{
    "results": 1,
    "data":
      [
          {
              "icao": "CYVR",
              "raw_text": "CYVR 090200Z 15006KT 20SM FEW100 FEW230 23/10 A2986 RMK AC1CI2 AC TR CONTRAILS SLP115 DENSITY ALT 1000FT",
              "barometer":
                { "hg": "29.86", "hpa": "1011", "kpa": "101.12", "mb": "1011.10" },
              "wind":
                {
                    "degrees": 150,
                    "speed_kts": 6,
                    "speed_kph": 11,
                    "speed_mps": 3,
                    "speed_mph": 7,
                },
              "clouds":
                [
                    {
                        "code": "FEW",
                        "name": "few",
                        "density": "1/8 - 2/8",
                        "feet": 10000,
                        "base_feet_agl": 10000,
                        "base_meters_agl": 3048,
                    },
                    {
                        "code": "FEW",
                        "name": "few",
                        "density": "1/8 - 2/8",
                        "feet": 23000,
                        "base_feet_agl": 23000,
                        "base_meters_agl": 7010,
                    },
                ],
              "visibility": { "miles_float": 20, "meters_float": 32187 },
              "temperature": { "celsius": 23, "fahrenheit": "73" },
              "dewpoint": { "celsius": 10, "fahrenheit": "50" },
              "humidity": { "percent": 44 },
              "elevation": { "feet": 7, "meters": 2 },
              "flight_category": "VFR",
              "station":
                {
                    "location":
                      {
                          "continent": "NA",
                          "country": "CA",
                          "region": "CA-BC",
                          "city": "Vancouver",
                          "name": "Vancouver International Airport",
                          "geometry":
                            { "coordinates": [ -123.17, 49.17 ], "type": "Point" },
                      },
                },
          },
      ],
}
```

### Multipe standard METARs

```yaml
{
    "results": 3,
    "data":
      [
          "CYVR 092300Z 12009KT 10SM -RA SCT055 BKN070 OVC095 13/11 A3002 RMK SC3AC2AC3 SLP168",
          "KBOS 092254Z 11004KT 10SM -RA FEW037 SCT080 BKN095 BKN130 14/13 A2972 RMK AO2 RAB16 SLP062 P0002 T01440128",
          "CYWG 092300Z 36015G21KT 15SM FEW070 24/08 A2986 RMK FU2 SLP116 DENSITY ALT 2200FT",
      ],
}
```

### Multiple decoded METARs

```yaml
{
    "results": 3,
    "data":
      [
          {
              "icao": "CYVR",
              "raw_text": "CYVR 092300Z 12009KT 10SM -RA SCT055 BKN070 OVC095 13/11 A3002 RMK SC3AC2AC3 SLP168",
              "barometer":
                { "hg": "30.02", "hpa": "1017", "kpa": "101.66", "mb": "1016.50" },
              "wind":
                {
                    "degrees": 120,
                    "speed_kts": 9,
                    "speed_kph": 17,
                    "speed_mps": 5,
                    "speed_mph": 10,
                },
              "clouds":
                [
                    {
                        "code": "SCT",
                        "name": "scattered",
                        "density": "3/8 - 4/8",
                        "feet": 5500,
                        "base_feet_agl": 5500,
                        "base_meters_agl": 1676,
                    },
                    {
                        "code": "BKN",
                        "name": "broken",
                        "density": "5/8 – 7/8",
                        "feet": 7000,
                        "base_feet_agl": 7000,
                        "base_meters_agl": 2134,
                    },
                    {
                        "code": "OVC",
                        "name": "overcast",
                        "density": "8/8",
                        "feet": 9500,
                        "base_feet_agl": 9500,
                        "base_meters_agl": 2896,
                    },
                ],
              "conditions":
                { "0": { "code": "-RA", "text": "light intensity rain" } },
              "visibility": { "miles_float": 10, "meters_float": 16093 },
              "temperature": { "celsius": 13, "fahrenheit": "55" },
              "dewpoint": { "celsius": 11, "fahrenheit": "52" },
              "humidity": { "percent": 88 },
              "elevation": { "feet": 7, "meters": 2 },
              "flight_category": "VFR",
              "station":
                {
                    "location":
                      {
                          "continent": "NA",
                          "country": "CA",
                          "region": "CA-BC",
                          "city": "Vancouver",
                          "name": "Vancouver International Airport",
                          "geometry":
                            { "coordinates": [ -123.17, 49.17 ], "type": "Point" },
                      },
                },
          },
          {
              "icao": "KBOS",
              "raw_text": "KBOS 092254Z 11004KT 10SM -RA FEW037 SCT080 BKN095 BKN130 14/13 A2972 RMK AO2 RAB16 SLP062 P0002 T01440128",
              "barometer":
                { "hg": "29.72", "hpa": "1006", "kpa": "100.64", "mb": "1006.30" },
              "wind":
                {
                    "degrees": 110,
                    "speed_kts": 4,
                    "speed_kph": 7,
                    "speed_mps": 2,
                    "speed_mph": 5,
                },
              "clouds":
                [
                    {
                        "code": "FEW",
                        "name": "few",
                        "density": "1/8 - 2/8",
                        "feet": 3700,
                        "base_feet_agl": 3700,
                        "base_meters_agl": 1128,
                    },
                    {
                        "code": "SCT",
                        "name": "scattered",
                        "density": "3/8 - 4/8",
                        "feet": 8000,
                        "base_feet_agl": 8000,
                        "base_meters_agl": 2438,
                    },
                    {
                        "code": "BKN",
                        "name": "broken",
                        "density": "5/8 – 7/8",
                        "feet": 9500,
                        "base_feet_agl": 9500,
                        "base_meters_agl": 2896,
                    },
                    {
                        "code": "BKN",
                        "name": "broken",
                        "density": "5/8 – 7/8",
                        "feet": 13000,
                        "base_feet_agl": 13000,
                        "base_meters_agl": 3962,
                    },
                ],
              "conditions":
                { "0": { "code": "-RA", "text": "light intensity rain" } },
              "visibility": { "miles_float": 10, "meters_float": 16093 },
              "temperature": { "celsius": 14.4, "fahrenheit": "58" },
              "dewpoint": { "celsius": 12.8, "fahrenheit": "55" },
              "humidity": { "percent": 90 },
              "elevation": { "feet": 13, "meters": 4 },
              "flight_category": "VFR",
              "station":
                {
                    "location":
                      {
                          "continent": "NA",
                          "country": "US",
                          "region": "US-MA",
                          "city": "Boston",
                          "name": "General Edward Lawrence Logan International Airport",
                          "geometry": { "coordinates": [ -71.02, 42.37 ], "type": "Point" },
                      },
                },
          },
          {
              "icao": "CYWG",
              "raw_text": "CYWG 092300Z 36015G21KT 15SM FEW070 24/08 A2986 RMK FU2 SLP116 DENSITY ALT 2200FT",
              "barometer":
                { "hg": "29.86", "hpa": "1011", "kpa": "101.12", "mb": "1011.10" },
              "wind":
                {
                    "degrees": 360,
                    "speed_kts": 15,
                    "speed_kph": 28,
                    "speed_mps": 8,
                    "speed_mph": 17,
                    "gust_kts": 21,
                    "gust_mps": 11,
                    "gust_kph": 39,
                    "gust_mph": 24,
                },
              "clouds":
                [
                    {
                        "code": "FEW",
                        "name": "few",
                        "density": "1/8 - 2/8",
                        "feet": 7000,
                        "base_feet_agl": 7000,
                        "base_meters_agl": 2134,
                    },
                ],
              "conditions": { "0": { "code": "FU2", "text": " smoke" } },
              "visibility": { "miles_float": 15, "meters_float": 24140 },
              "temperature": { "celsius": 24, "fahrenheit": "75" },
              "dewpoint": { "celsius": 8, "fahrenheit": "46" },
              "humidity": { "percent": 36 },
              "elevation": { "feet": 781, "meters": 238 },
              "flight_category": "VFR",
              "station":
                {
                    "location":
                      {
                          "continent": "NA",
                          "country": "CA",
                          "region": "CA-MB",
                          "city": "Winnipeg",
                          "name": "Winnipeg / James Armstrong Richardson International Airport",
                          "geometry": { "coordinates": [ -97.23, 49.9 ], "type": "Point" },
                      },
                },
          },
      ],
}
```

---

## Weather

### Note:

- All METARs that does not belong to Navdata are removed.
- The data will be updated every 10 minutes.

---
### <p style="text-align: center;">***Country Scope***</p>
---

### Get METARs for country sorted by temperature

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the temperature, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/country-weather/temperature/:country

```bat
# Get METARs based on the temperature for Canada, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/temperature/ca?sort=-1&limit=20&decode=true

# Get METARs based on the temperature for UK, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/temperature/gb

```

---

### Get METARs for country sorted by visibility

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the visibility, 1 for low/bad visibility to good|1|
|limit|Number of returned METARs |10|

    GET /weather/country-weather/visibility/:country

```bat
# Get METARs based on the visibility for Canada, sorted from low to high with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/temperature/ca?limit=20&decode=true

# Get METARs based on the visibility for China, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/visibility/cn

```

---

### Get METARs for country sorted by barometer

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the barometer, 1 for low baromter to high|1|
|limit|Number of returned METARs |10|

    GET /weather/country-weather/baro/:country

```bat
# Get METARs based on the barometer for Canada, sorted from low to high with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/baro/ca?limit=20&decode=true

# Get METARs based on the barometer for USA, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/baro/us&sort=-1

```

---

### Get METARs for country sorted by wind gust speed

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/country-weather/wind-gust-speed/:country

```bat
# Get METARs based on the wind gust speed for Canada, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-gust-speed/ca?limit=20&decode=true

# Get METARs based on the wind gust speed for USA, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-gust-speed/us

```

---

### Get METARs for country sorted by wind gust speed

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/country-weather/wind-gust-speed/:country

```bat
# Get METARs based on the wind gust speed for Canada, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-gust-speed/ca?limit=20&decode=true

# Get METARs based on the wind gust speed for USA, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-gust-speed/us

```

---

### Get METARs for country sorted by wind speed

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| country           | Two letters country code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/country-weather/wind-speed/:country

```bat
# Get METARs based on the wind speed for Canada, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-speed/ca?limit=20&decode=true

# Get METARs based on the wind speed for Germany, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/country-weather/wind-speed/de

```

---
### <p style="text-align: center;">***Continent Scope***</p>
---

### Get METARs for continent sorted by temperature

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| continent           | Two letters continent code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the temperature, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/continent-weather/temperature/:continent

```bat
# Get METARs based on the temperature for Asia, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/temperature/as?sort=-1&limit=20&decode=true

# Get METARs based on the temperature for Europe, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/temperature/eu

```

---

### Get METARs for continent sorted by visibility

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| continent           | Two letters continent code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the visibility, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/continent-weather/temperature/:continent

```bat
# Get METARs based on the visibility for Asia, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/visibility/as?sort=-1&limit=20&decode=true

# Get METARs based on the visibility for North America, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/visibility/na

```

---

### Get METARs for continent sorted by barometer

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| continent           | Two letters continent code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the borometer, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/continent-weather/baro/:continent

```bat
# Get METARs based on the barometer for Asia, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/baro/as?sort=-1&limit=20&decode=true

# Get METARs based on the barometer for North America, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/baro/na

```

---

### Get METARs for continent sorted by wind gust speed

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| continent           | Two letters continent code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/continent-weather/wind-gust-speed/:continent

```bat
# Get METARs based on the wind gust speed for Asia, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/wind-gust-speed/as?limit=20&decode=true

# Get METARs based on the wind gust speed for Africa, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/wind-gust-speed/af

```

---

### Get METARs for continent sorted by wind speed

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| continent           | Two letters continent code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/continent-weather/wind-speed/:country

```bat
# Get METARs based on the wind speed for Asia, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/wind-speed/as?limit=20&decode=true

# Get METARs based on the wind speed for Europe, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/wind-speed/eu

```

---
### <p style="text-align: center;">***Global Scope***</p>
---

### Get METARs for global sorted by temperature

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the temperature, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/global-weather/temperature

```bat
# Get METARs based on the temperature for global, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/temperature?sort=-1&limit=20&decode=true

# Get METARs based on the temperature for Europe, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/temperature

```

---

### Get METARs for global sorted by visibility

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the visibility, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/global-weather/temperature

```bat
# Get METARs based on the visibility for global, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/visibility?sort=-1&limit=20&decode=true

# Get METARs based on the visibility for global, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/continent-weather/visibility

```

---

### Get METARs for global sorted by barometer

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
| sort|Sort the borometer, 1 for low to high|1|
|limit|Number of returned METARs |10|

    GET /weather/global-weather/baro/:continent

```bat
# Get METARs based on the barometer for global, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/baro?sort=-1&limit=20&decode=true

# Get METARs based on the barometer for global, sorted from low to high with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/baro

```

---

### Get METARs for global sorted by wind gust speed

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/global-weather/wind-gust-speed

```bat
# Get METARs based on the wind gust speed for global, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/wind-gust-speed?limit=20&decode=true

# Get METARs based on the wind gust speed for global, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/wind-gust-speed

```

---

### Get METARs for global sorted by wind speed

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/global-weather/wind-speed/:country

```bat
# Get METARs based on the wind speed for global, sorted from high to low with 20 results and decoded
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/wind-speed?limit=20&decode=true

# Get METARs based on the wind speed for global, sorted from high to low with 10 results and returned as raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/weather/global-weather/wind-speed

```

---
### <p style="text-align: center;">***METAR Search***</p>
---

### Search METAR for ICAO code

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| icao           | ICAO code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/search-weather/icao/:icao

```bat
# Get decoded METAR for CYWG
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/icao/cywg?decode=true

# Get raw METAR for KBOS
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/icao/kbos

```

---

### Search METAR for IATA code

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| iata           | IATA code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/search-weather/iata/:iata

```bat
# Get decoded METAR for CYWG
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/iata/ywg?decode=true

# Get raw METAR for KBOS
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/iata/bos

```

---

### Search METAR for airport's name

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| name           | Airport name |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/search-weather/name/:name

```bat
# Get decoded METAR for airport's name that included "pudong"
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/name/pudong?decode=true

# Get raw METAR for airport's name that included boston
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/name/boston

```

---

### Search METAR based on the generic input

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| data           | Generic search query |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |
|limit|Number of returned METARs |10|

    GET /weather/search-weather/generic/:data

```bat
# Get decoded METAR for airport's name, city or location that included "shanghai"
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/generic/shanghai?decode=true

# Get raw METAR for airport's name, city or location that included new york
$ curl https://flight-data.herokuapp.com/api/v1/weather/search-weather/name/new york

```

## Airports

### Get Airport data using ICAO

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| icao           | ICAO code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |

    GET /airports/icao/:icao

```bat
# Get airport with ICAO code, with METAR decoded
$ curl https://flight-data.herokuapp.com/api/v1/airports/icao/cyyz?decode=true

# Get airport with ICAO code, with raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/airports/icao/ksan
```

---

### Get Airport data using iata

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| iata           | IATA code |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |

    GET /airports/iata/:iata

```bat
# Get airport with IATA code, with METAR decoded
$ curl https://flight-data.herokuapp.com/api/v1/airports/iata/ywg?decode=true

# Get airport with IATA code, with raw METAR
$ curl https://flight-data.herokuapp.com/api/v1/airports/iata/jfk

```

---

### Get Airport data using city name

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| name           | city name |

| URL Queries | Description                  | Default |
|-------------|------------------------------|---------|
| limitResults | limit number of results | 10      |

    GET /airports/city/:name

```bat
# Get airports with city named winnipeg
$ curl https://flight-data.herokuapp.com/api/v1/airports/city/winnipeg

# Only return25 results
$ curl https://flight-data.herokuapp.com/api/v1/airports/city/boston?limitResults=2

# Get airports with region name, region name can be either province or state or state
$ curl https://flight-data.herokuapp.com/api/v1/airports/city/manitoba?limitResults=2
$ curl https://flight-data.herokuapp.com/api/v1/airports/city/california?limitResults=3
```

---

### Get Airport data using country name or country code

| URL Parameters | Description                                      |
|----------------| ------------------------------------------------ |
| country        | city name |

| URL Queries | Description                  | Default |
|-------------|------------------------------|---------|
| limitResults | limit number of results | 10      |

    GET /airports/city/:name

```bat
# Get airports with country code: ca
$ curl https://flight-data.herokuapp.com/api/v1/airports/country/ca?limitResults=2

# Get airport with country name: united states
curl https://flight-data.herokuapp.com/api/v1/airports/country/united states?limitResults=15

```

---

### Get Airport data using generic info (fuzzy search)

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| data           | generic serach query |

| URL Queries  | Description                      | Default |
|--------------| -------------------------------- |---------|
| limitResults | limit number of results | 10      |

    GET /airports/generic/:data

```bat
# Get airports which includes "new york" text (this would return 68 results)
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/new york

# Only return 5 results
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/new york?limitResults=5

# Or only enter ICAO or IATA code
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/cywg
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/bos

# Or enter region name or city name
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/manitoba

# or enter country name
$ curl https://flight-data.herokuapp.com/api/v1/airports/generic/China

```

---

### Get Airport data using generic info (fuzzy search & pagination)

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| data           | generic serach query |

| URL Queries  | Description              | Default |
|--------------|--------------------------|---------|
| limit | number of items per page | 10      |
|page| page number | 1|

    GET /airports/generic/paginate/:data

```bat
# Get airports located in New York, each page return 15 airports, current page: 1
$ curl https://flight-data.herokuapp.com/api/v1/airports/geneirc/paginate/new york?limit=15&page=1

```

---

### Get Airport data within radius of ICAO

| URL Parameters | Description                                      |
|---------------| ------------------------------------------------ |
| icao          | ICAO code|
| distance	     | distance of radius|
| unit          | km or nm|

| URL Queries  | Description                      | Default |
|--------------| -------------------------------- |---------|
| limitResults | limit number of results | 10      |

    GET /airports/airports-within/icao/:icao/distance/:distance/unit/:unit

---

### Get distance from origin airport to destination airport

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| origin   | origin airport ICAO code|
|destination |destination airport ICAO code|
|unit         | km or nm|

    GET /airports-distance/origin/:originICAO/destination/:destinationICAO/unit/:unit

---

---

### References:

- [VATSIM Data](https://data.vatsim.net/v3/vatsim-data.json)
- [Global Weather Data](https://www.aviationweather.gov/dataserver)

### Credits

- [ FAA DATIS ](https://datis.clowd.io/)
