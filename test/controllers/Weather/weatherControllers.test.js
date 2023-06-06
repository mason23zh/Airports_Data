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
const { getMetarsWithin, getMetarUsingGenericInput } = require("../../../controllers/Weather/weatherControllers");

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
        console.log(getAwcMetarUsingGenericInput.mock.results);

        expect(getAwcMetarUsingGenericInput).toBeCalledTimes(1);
    });

    it("Should response with status code 200 and array if getAwcMetarUsingGenericInput returned not null", async () => {
        const request = httpMocks.createRequest({
            params: { data: "London" },
            query: {
                decode: true,
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
                decode: true,
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
