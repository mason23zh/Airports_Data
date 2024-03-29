const MetarFeatures = require("../../../controllers/METAR/MetarFeatures");
const {
    getAwcMetarUsingICAO,
    getAwcMetarUsingGenericInput,
    getAwcMetarUsingAirportName,
} = require("../../../utils/AWC_Weather/controller_helper");

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
});

describe("Test for getAwcMetarUsingICAO function", () => {
    it("requestMetarUsingICAO function should be called", async () => {
        await getAwcMetarUsingICAO();
        expect(MetarFeatures).toBeCalledTimes(1);
        expect(mockRequestMetarUsingICAO).toBeCalledTimes(1);

        // expect(requestMetarUsingICAO).toBeCalledTimes(1);
    });
    it("should throw error if requestMetarUsingICAO return null", async () => {
        mockRequestMetarUsingICAO.mockImplementationOnce(() => null);
        try {
            await getAwcMetarUsingICAO();
            expect(MetarFeatures).toBeCalledTimes(1);
            expect(mockGetDecodedMetar).toBeCalledTimes(0);
        } catch (e) {
            expect(e.statusCode).toBe(500);
            expect(e.message).toBe("Something went wrong, please try again later");
        }
    });
    it("should call getDecodedMetar function if requestMetarUsingICAO return not null and decode flag is true", async () => {
        await getAwcMetarUsingICAO("EGKK", true);
        expect(MetarFeatures).toBeCalledTimes(1);
        expect(mockGetDecodedMetar).toBeCalledTimes(1);
    });

    it("should call getRawMetar function if requestMetarUsingICAO return not null and decode flag is false", async () => {
        await getAwcMetarUsingICAO("EGKK", false);
        expect(MetarFeatures).toBeCalledTimes(1);
        expect(mockGetRawMetar).toBeCalledTimes(1);
    });
});

describe("Test for getAwcMetarUsingGenericInput function", () => {
    it("MetarFeatures should be called", async () => {
        try {
            await getAwcMetarUsingGenericInput();
            expect(MetarFeatures).toBeCalledTimes(1);
        } catch (e) {
            expect(e.statusCode).toBe(500);
        }
    });

    it("requestMetarUsingGenericInput function should be called", async () => {
        try {
            await getAwcMetarUsingGenericInput();
            expect(mockRequestMetarUsingGenericInput).toBeCalledTimes(1);
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it("should return responseMetars if requestMetarUsingGenericInput return not null", async () => {
        try {
            mockRequestMetarUsingGenericInput.mockResolvedValueOnce([{ icao: "CYWG" }, { icao: "CYUL" }]);
            await getAwcMetarUsingGenericInput();
            expect(mockRequestMetarUsingGenericInput).toBeCalledTimes(1);
            let result = await mockRequestMetarUsingGenericInput.mock.results[0].value;
            let expected = [{ icao: "CYWG" }, { icao: "CYUL" }];
            expect(result).toEqual(expected);
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it("should return empty array if requestMetarUsingGenericInput return empty array", async () => {
        try {
            mockRequestMetarUsingGenericInput.mockResolvedValueOnce([]);
            const response = await getAwcMetarUsingGenericInput();
            expect(mockRequestMetarUsingGenericInput).toBeCalledTimes(1);
            expect(response.length).toEqual(0);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});

describe("Test for getAwcMetarUsingAirportName function", () => {
    it("should make a new MetarFeatures and throw error", async () => {
        try {
            await getAwcMetarUsingGenericInput();
            expect(MetarFeatures).toBeCalledTimes(1);
        } catch (e) {
            expect(e.statusCode).toEqual(500);
        }
    });

    it("should call requestMetarUsingAirportName function", async () => {
        try {
            await getAwcMetarUsingAirportName();
            expect(mockRequestMetarUsingAirportName).toBeCalledTimes(1);
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it("should return response if requestMetarUsingAirportName return a non-empty array", async () => {
        try {
            mockRequestMetarUsingAirportName.mockResolvedValueOnce([{ icao: "CYWG" }, { icao: "CYUL" }]);
            await getAwcMetarUsingAirportName();
            const expected = [{ icao: "CYWG" }, { icao: "CYUL" }];
            const result = mockRequestMetarUsingAirportName.mock.results[0].value;
            await expect(result).resolves.toEqual(expected);
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it("should return null if requestMetarUsingAirportName return an empty array", async () => {
        try {
            mockRequestMetarUsingAirportName.mockResolvedValueOnce([]);
            const response = await getAwcMetarUsingAirportName();
            expect(response.length).toEqual(0);
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });
});
