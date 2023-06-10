# Flight Data

## This is an API to get data for the airports, runways, METARs and etc.

### Base URL: https://flight-data.herokuapp.com/api/v1

## METAR

### Get METAR using ICAO code

| URL Parameters | Description                                      |
| -------------- | ------------------------------------------------ |
| icao           | A single or multiple ICAO codes (Max Number: 30) |

| URL Queries | Description                      | Default |
| ----------- | -------------------------------- | ------- |
| decode      | return decoded METAR or raw text | false   |

    GET /get-metar/:icao

```bat
# Single ICAO
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/cywg

# Single ICAO decoded
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/cywg?decode=true

# Multiple ICAOs
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/cywg,klas,zspd

# Multiple ICAOs decoded
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/klax,cyvr,cyyz?decode=true
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

    GET /get-metar/radius/:icao

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
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/radius/coordinates/-97.5,49.9
```

---

### Get nearest METAR by ICAO

| URL Parameters | Description        |
| -------------- | ------------------ |
| icao           | A single ICAO code |

| URL Queries | Type    | Description                      | Default |
| ----------- | ------- | -------------------------------- | ------- |
| decode      | boolean | return decoded METAR or raw text | false   |

    GET /get-metar/radius/nearest/:icao

```bat
# Get nearest METAR from KBOS
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/nearest/KBOS
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
$ curl https://flight-data.herokuapp.com/api/v1/get-metar/nearest/coordinates/-97.5,49.9
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

## Airports

### base URL: _/api/v1/airports_

**End Points**:

Get All Airports:\  
Example: **_/api/v1/airports/all-airports_**

Get Airports With Generic Input:\  
This endpoint would accept city name, airport name or ICAO\  
Example: **_/api/v1/airports/generic/new york_**\  
Example: **_/api/v1/airports/generic/CYWG_**

Get Airports By ICAO:\  
Example: **_/api/v1/airports/icao/cywg_**

Get Airports By IATA:\  
Example: **_/api/v1/airports/iata/ywg_**

Get Airports By Type (large\*airport, medium_airport, small_airport,heliport,seaplane_base,closed_airport)\  
Example: \*\*\*/api/v1/airports/type/heliport\_\*\*

Get Airports By Name (Able to partially match e.g. winnipeg would match 3 results)\  
Example: **_/api/v1/airports/name/Winnipeg_**

Get airports within certain radius (km for kilometers, nm or nautical miles )\  
Example: **_/api/v1/airports/airports-within/icao/katl/distance/30/unit/nm_**

Get distance between origin airport and destination airport (km for kilometers, nm or nautical miles)\  
Example: **_/api/v1/airports/airports-distance/origin/katl/destination/kjax/unit/nm_**

---

### Airports Query:

limitFields\  
Example: **_/api/v1/airports/all-airports?fields=icao+type_**

limitResults\n  
Example: **_/api/v1/airports/all-airports?limitedResults=3_**

paginate  
Example: **_/api/v1/airports/all-airports?page=1&limit=3_**

### Users: _/api/v1/users_

**End Points**:

Signup: \  
Example: **_/api/v1/users/signup_**

Login:\  
Example: **_/api/v1/users/login_**

---

### Additional Features

METAR: Decoded + Raw METAR

ATIS: FAA published and Vatsim (if they are available)

Weather: List worst weather for selected country, continent for global.

---

### ToDo List:

- ~~Commentary system to allow user to add comment to airport, such like videos, airport remark, landing performances  
  and  
  etc.~~
- ~~ILS~~
- ~~ATIS~~
- NOTAM
- ~~Get Airports by Weather filter~~
- Geo data:
    - ~~Nearby airports from selected airport~~
    - ~~Distance between origin airports to destination airport(approximate ground distance)~~
    - \*Distance between origin airports to destination airport (approximate air distance)
- ~~Protected Routes~~
- Zibo Updates Download (Patch Only, Azure CDN if time allowed)
- DB modification with Admin authorization.
- \*Navigraph Navdata parser to update the Airports DB. DB Size reduce.
- Add Navigraph integration to allow registered user to access more data.
- Vatsim data display

    - Online regions
    - ~~ATIS~~

\*Require complete DB model and controllers refactor

\*Need waypoints coordinates to preform graph search

---

### References:

- [VATSIM Data](https://data.vatsim.net/v3/vatsim-data.json)
- [Global Weather Data](https://www.aviationweather.gov/dataserver)

### Credits

- [ FAA DATIS ](https://datis.clowd.io/) New Document
