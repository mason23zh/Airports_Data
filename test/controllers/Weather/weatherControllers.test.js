const httpMocks = require("node-mocks-http");
const weatherControllers = require("../../../controllers/Weather/weatherControllers");
jest.mock("../../../utils/checkICAO");
jest.mock("../../../utils/AWC_Weather/controller_helper");
const { checkICAO } = require("../../../utils/checkICAO");
const {
    getAwcMetarUsingICAO,
    getAwcMetarUsingAirportName,
    getAwcMetarUsingGenericInput,
} = require("../../../utils/AWC_Weather/controller_helper");
const MetarFeatures = require("../../../controllers/METAR/MetarFeatures");
const {
    getMetarsWithin,
    getMetarUsingGenericInput,
    getMetarUsingAirportName,
    getMetarUsingICAO,
    getWindGustForCountry,
} = require("../../../controllers/Weather/weatherControllers");
const { AwcWeatherMetarModel } = require("../../../models/weather/awcWeatherModel");

const mockRequestMetarUsingICAO = jest.fn(function () {
    return this;
});
const mockGetDecodedMetar = jest.fn().mockResolvedValue({ icao: "CYWG" });
const mockGetRawMetar = jest.fn();
const mockRequestMetarWithinRadius_icao = jest.fn().mockResolvedValue([{ icao: "CYWG" }, { icao: "CYUL" }]);
const mockRequestMetarWithinRadius_LngLat = jest.fn().mockResolvedValue([{ icao: "CYWG" }, { icao: "CYUL" }]);
const mockRequestNearestMetar_icao = jest.fn().mockResolvedValue([{ icao: "CYWG" }]);
const mockRequestNearestMetar_LngLat = jest.fn().mockResolvedValue([{ icao: "CYWG" }]);
const mockRequestMetarUsingAirportName = jest.fn();
const mockRequestMetarUsingGenericInput = jest.fn();
const mockRequestMetarCategory_local = jest.fn();

jest.mock("../../../controllers/METAR/MetarFeatures", () =>
    jest.fn().mockImplementation(() => ({
        requestMetarUsingICAO: mockRequestMetarUsingICAO,
        getDecodedMetar: mockGetDecodedMetar,
        getRawMetar: mockGetRawMetar,
        requestMetarWithinRadius_icao: mockRequestMetarWithinRadius_icao,
        requestMetarWithinRadius_LngLat: mockRequestMetarWithinRadius_LngLat,
        requestNearestMetar_icao: mockRequestNearestMetar_icao,
        requestNearestMetar_LngLat: mockRequestNearestMetar_LngLat,
        requestMetarUsingAirportName: mockRequestMetarUsingAirportName,
        requestMetarUsingGenericInput: mockRequestMetarUsingGenericInput,
        requestMetarCategory_local: mockRequestMetarCategory_local,
    }))
);

beforeEach(() => {
    MetarFeatures.mockClear();
    mockGetRawMetar.mockClear();
    mockGetDecodedMetar.mockClear();
    mockRequestMetarUsingICAO.mockClear();
    mockRequestNearestMetar_LngLat.mockClear();
    mockRequestNearestMetar_icao.mockClear();
    mockRequestMetarUsingAirportName.mockClear();
    mockRequestMetarUsingGenericInput.mockClear();
    mockRequestMetarWithinRadius_icao.mockClear();
    getAwcMetarUsingICAO.mockClear();
    getAwcMetarUsingGenericInput.mockClear();
    getAwcMetarUsingAirportName.mockClear();
    mockRequestMetarCategory_local.mockClear();
});

// afterEach(() => {
//     jest.resetAllMocks();
// });

describe("Test for getMetarsWithin controller", () => {
    it("should check if checkICAO return true, MetarFeature and requestMetarWithinRadius_icao function will be called", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGSS" },
            query: {
                distance: 15,
                unit: "km",
            },
        });
        const response = httpMocks.createResponse();
        mockRequestMetarWithinRadius_icao.mockResolvedValueOnce([{ icao: "EGLL" }, { icao: "EGCC" }]);
        checkICAO.mockImplementationOnce(() => true);

        await getMetarsWithin(request, response);
        expect(MetarFeatures).toBeCalledTimes(1);
        expect(mockRequestMetarWithinRadius_icao).toBeCalledTimes(1);
    });

    it("should check if requestMetarWithinRadius_icao return the correct value, response should be 200 with array", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGSS" },
            query: {
                distance: 15,
                unit: "km",
            },
        });
        const response = httpMocks.createResponse();
        mockRequestMetarWithinRadius_icao.mockResolvedValueOnce([{ icao: "EGLL" }, { icao: "EGCC" }]);
        checkICAO.mockImplementationOnce(() => true);

        await getMetarsWithin(request, response);
        const results = await mockRequestMetarWithinRadius_icao.mock.results[0].value;
        const expected = [{ icao: "EGLL" }, { icao: "EGCC" }];
        expect(results).toEqual(expected);
        expect(response.statusCode).toEqual(200);
    });

    it("should check if requestMetarWithinRadius_icao return null or empty array, response should be 404 with empty array", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGSS" },
            query: {
                distance: 15,
                unit: "km",
            },
        });
        const response = httpMocks.createResponse();
        mockRequestMetarWithinRadius_icao.mockResolvedValueOnce([]);
        checkICAO.mockImplementationOnce(() => true);

        await getMetarsWithin(request, response);
        const results = await mockRequestMetarWithinRadius_icao.mock.results[0].value;
        expect(results).toEqual([]);
        expect(response.statusCode).toEqual(404);
    });

    it("should throw NotFoundError if checkICAO return false", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGSS" },
            query: {
                distance: 15,
                unit: "km",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => false);
        mockRequestMetarWithinRadius_icao.mockResolvedValueOnce([]);
        try {
            await getMetarsWithin(request, response);
            expect(MetarFeatures).toBeCalledTimes(0);
            expect(mockRequestMetarWithinRadius_icao).toBeCalledTimes(0);
        } catch (e) {
            expect(e.statusCode).toEqual(404);
            expect(e.message).toEqual("Please provide correct ICAO code");
        }
    });
});

describe("Test for getMetarUsingGenericInput controller", () => {
    it("Should run getAwcMetarUsingICAO function if checkICAO return true", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: true,
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);

        await getMetarUsingGenericInput(request, response);
        getAwcMetarUsingICAO.mockResolvedValueOnce({ icao: "EGLL" });
        expect(getAwcMetarUsingICAO).toBeCalledTimes(1);
    });

    it("Should response with status code 200 and array if getAwcMetarUsingICAO returned not null", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: true,
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);

        await getMetarUsingGenericInput(request, response);
        getAwcMetarUsingICAO.mockResolvedValueOnce({ icao: "EGKK" });
        expect(getAwcMetarUsingICAO).toBeCalledTimes(1);
        const tempResult = await getAwcMetarUsingICAO.mock.results[0].value;
        expect(response._getJSONData().data).toEqual([tempResult]);
        expect(response.statusCode).toEqual(200);
        jest.resetAllMocks();
    });

    it("Should response with status code 404 and empty array if getAwcMetarUsingICAO returned null", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: true,
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);

        await getMetarUsingGenericInput(request, response);
        getAwcMetarUsingICAO.mockResolvedValueOnce(null);
        expect(response.statusCode).toEqual(404);
        expect(response._getJSONData().data).toEqual([]);
    });

    it("Should run getAwcMetarUsingGenericInput if checkICAO function returns false", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: true,
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => false);
        await getMetarUsingGenericInput(request, response);
        getAwcMetarUsingGenericInput.mockResolvedValue([{ icao: "ZSPD" }, { icao: "CYWG" }]);

        expect(getAwcMetarUsingGenericInput).toBeCalledTimes(1);
    });

    it("Should response with status code 200 and array if getAwcMetarUsingGenericInput returned not null", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => false);
        await getMetarUsingGenericInput(request, response);

        const tempResult = await getAwcMetarUsingGenericInput.mock.results[0].value;
        expect(response._getJSONData().data).toEqual(tempResult);
        expect(response.statusCode).toEqual(200);
    });

    it("Should response with status code 404 and empty array if getAwcMetarUsingGenericInput returns null", async () => {
        jest.resetAllMocks();
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => false);
        getAwcMetarUsingGenericInput.mockResolvedValueOnce(null);
        await getMetarUsingGenericInput(request, response);
        expect(response._getStatusCode()).toEqual(404);
        expect(response._getJSONData().data).toEqual([]);
    });
});

describe("Test for getMetarUsingAirportName controller", () => {
    it("Should call getAwcMetarUsingAirportName function", async () => {
        const request = httpMocks.createRequest({
            params: { name: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        await getMetarUsingAirportName(request, response);
        expect(getAwcMetarUsingAirportName).toBeCalledTimes(1);
        expect(getAwcMetarUsingAirportName).toBeCalledWith("London", true, AwcWeatherMetarModel, undefined);
    });

    it("Should response with status code 200 and array if getAwcMetarUsingAirportName return not null", async () => {
        const request = httpMocks.createRequest({
            params: { name: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();

        getAwcMetarUsingAirportName.mockResolvedValueOnce([{ icao: "ZSSS" }, { icao: "KBOS" }, { icao: "KJFK" }]);
        await getMetarUsingAirportName(request, response);
        const results = await getAwcMetarUsingAirportName.mock.results[0].value;
        expect(response._getJSONData().data).toEqual(results);
        jest.resetAllMocks();
    });

    it("Should response 404 with empty array if getAwcMetarUsingAirport return null or empty array", async () => {
        const request = httpMocks.createRequest({
            params: { name: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        await getMetarUsingAirportName(request, response);

        getAwcMetarUsingAirportName.mockResolvedValueOnce(null);
        expect(response._getJSONData().data).toEqual([]);
        getAwcMetarUsingAirportName.mockResolvedValueOnce([]);
        expect(response._getJSONData().data).toEqual([]);
    });
});

describe("Test for getMetarUsingICAO controller", () => {
    it("Should throw new NotFoundError if checkICAO function returns false", async () => {
        const request = httpMocks.createRequest({
            params: { name: "London" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => false);
        try {
            await getMetarUsingICAO(request, response);
        } catch (e) {
            expect(e.statusCode).toEqual(404);
            expect(e.message).toEqual("Please provide correct ICAO code");
        }
    });

    it("Should call getAwcMetarUsingICAO function if checkICAO return true", async () => {
        const request = httpMocks.createRequest({
            params: { ICAO: "EGKK" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);
        await getMetarUsingICAO(request, response);
        expect(getAwcMetarUsingICAO).toBeCalledTimes(1);
        expect(getAwcMetarUsingICAO).toBeCalledWith("EGKK", true);
    });

    it("Should response status code 200 if getAwcMetarUsingICAO return not null", async () => {
        const request = httpMocks.createRequest({
            params: { ICAO: "EGKK" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);
        getAwcMetarUsingICAO.mockResolvedValueOnce({ ICAO: "EGKK" });

        await getMetarUsingICAO(request, response);
        const result = await getAwcMetarUsingICAO.mock.results[0].value;
        expect(response._getJSONData().data).toEqual([result]);
        expect(response._getStatusCode()).toEqual(200);
    });

    it("Should response status code 404 if getAwcMetarUsingICAO return null", async () => {
        const request = httpMocks.createRequest({
            params: { ICAO: "KMMM" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        checkICAO.mockImplementationOnce(() => true);
        getAwcMetarUsingICAO.mockResolvedValueOnce(null);
        await getMetarUsingICAO(request, response);

        expect(response._getJSONData().data).toEqual([]);
        expect(response._getStatusCode()).toEqual(404);
    });
});

describe("Test for getWindGustForCountry controller", () => {
    it("should call MetarFeatures and requestMEtarCategory_local function", async () => {
        const request = httpMocks.createRequest({
            params: { country: "ca" },
            query: {
                limit: 15,
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        await getWindGustForCountry(request, response);
        mockRequestMetarCategory_local.mockResolvedValueOnce([{ icao: "EGKK" }, { icao: "EGSS" }]);
        expect(MetarFeatures).toBeCalledTimes(1);
        // expect(mockRequestMetarCategory_local).toBeCalledTimes(1);
        // expect(mockRequestMetarCategory_local).toBeCalledWith("ios_country", "ca", "wind_gust_kt", -1, 15, true);
    });
});
