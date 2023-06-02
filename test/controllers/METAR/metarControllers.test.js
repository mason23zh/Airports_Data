const request = require("supertest");
const app = require("../../../app");
const httpMocks = require("node-mocks-http");
const { getMetar, getRadiusMetar, getRadiusMetarWithLngLat } = require("../../../controllers/METAR/metarControllers");
const MetarFeatures = require("../../../controllers/METAR/MetarFeatures");

jest.mock("../../../controllers/METAR/MetarFeatures");

const mockRequestMetarUsingICAO = jest.fn(function () {
    return this;
});
const mockGetDecodedMetar = jest.fn();
const mockGetRawMetar = jest.fn();
const mockRequestMetarWithinRadius_icao = jest.fn();
const mockRequestMetarWithinRadius_LngLat = jest.fn(() => []);

jest.mock("../../../controllers/METAR/MetarFeatures", () =>
    jest.fn().mockImplementation(() => ({
        requestMetarUsingICAO: mockRequestMetarUsingICAO,
        getDecodedMetar: mockGetDecodedMetar,
        getRawMetar: mockGetRawMetar,
        requestMetarWithinRadius_icao: mockRequestMetarWithinRadius_icao,
        requestMetarWithinRadius_LngLat: mockRequestMetarWithinRadius_LngLat,
    }))
);

beforeEach(() => {
    MetarFeatures.mockClear();
    mockGetRawMetar.mockClear();
    mockGetDecodedMetar.mockClear();
    mockRequestMetarUsingICAO.mockClear();
});
describe("Test getMetar controller", () => {
    it("check if getRawMetar function being called if decode flag is false", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGKK,EGCC,CYUL,ZSSS,ZSPD" },
            query: { decode: "false" },
        });
        const response = httpMocks.createResponse();
        await getMetar(request, response);
        expect(MetarFeatures).toBeDefined();
        expect(mockRequestMetarUsingICAO).toHaveBeenCalledTimes(5);
        expect(mockGetDecodedMetar).toHaveBeenCalledTimes(0);
        expect(mockGetRawMetar).toHaveBeenCalledTimes(5);
        expect(response.statusCode).toEqual(200);
    });

    it("check if getDecodedMetar function being called if decode flag is true", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGKK,EGCC,CYUL,ZSSS,ZSPD" },
            query: { decode: "true" },
        });
        const response = httpMocks.createResponse();
        await getMetar(request, response);
        expect(MetarFeatures).toBeDefined();
        expect(mockRequestMetarUsingICAO).toHaveBeenCalledTimes(5);
        expect(mockGetDecodedMetar).toHaveBeenCalledTimes(5);
        expect(mockGetRawMetar).toHaveBeenCalledTimes(0);
    });

    it("check if Maximum number of reached error being throwed if number of icao reached over 30", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGKK,EGCC,CYUL,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,ZSSS,ZSPD" },
            query: { decode: "true" },
        });
        const response = httpMocks.createResponse();

        try {
            await getMetar(request, response);
        } catch (e) {
            expect(e.message).toBe("Maximum number of icao reached. Limited to 30.");
            expect(e.statusCode).toBe(429);
            expect(MetarFeatures).toHaveBeenCalledTimes(0);
            expect(mockRequestMetarUsingICAO).toHaveBeenCalledTimes(0);
            expect(mockGetDecodedMetar).toHaveBeenCalledTimes(0);
            expect(mockGetRawMetar).toHaveBeenCalledTimes(0);
        }
    });
});

describe("Test getRadiusMetar controller", () => {
    it("Check if requestMetarWithinRadius_icao function been called", async () => {
        const request = httpMocks.createRequest({
            params: { icao: "EGKK" },
            query: { distance: 10, unit: "mile", decode: "false" },
        });
        const response = httpMocks.createResponse();

        await getRadiusMetar(request, response);
        expect(MetarFeatures).toHaveBeenCalledTimes(1);
        expect(mockRequestMetarWithinRadius_icao).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(200);
    });
});

describe("Test getRadiusMetarWithLngLat controller", () => {
    it("Check if requestMetarWithinRadius_LngLat function been called", async () => {
        const request = httpMocks.createRequest({
            params: { coordinates: "40.1,30.5" },
            query: { distance: 10, unit: "mile", decode: "false" },
        });

        const res = httpMocks.createResponse();

        await getRadiusMetarWithLngLat(request, res);
        expect(MetarFeatures).toHaveBeenCalledTimes(1);
        expect(mockRequestMetarWithinRadius_LngLat).toHaveBeenCalledTimes(1);
    });
});
