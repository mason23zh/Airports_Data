const MetarFeatures = require("../../../controllers/METAR/MetarFeatures");
const { getWindGustForCountry } = require("../../../controllers/Weather/weatherControllers");
const httpMocks = require("node-mocks-http");
jest.mock("../../../controllers/METAR/MetarFeatures");

const mockRequestMetarCategory_local = jest.fn();
jest.mock("../../../controllers/METAR/MetarFeatures", () => {
    return Object.assign(
        jest.fn(() => {
            return {
                requestMetarCategory_local: mockRequestMetarCategory_local,
            };
        }),
        { mockRequestMetarCategory_local }
    );
});

beforeEach(() => {
    MetarFeatures.mockClear();
    mockRequestMetarCategory_local.mockClear();
});

describe("Test for mock class", () => {
    it("should call METAR features constructor", async () => {
        const request = httpMocks.createRequest({
            params: { country: "ca" },
            query: {
                decode: "true",
            },
        });
        const response = httpMocks.createResponse();
        mockRequestMetarCategory_local.mockResolvedValue([{ icao: "EGKK" }]);
        await getWindGustForCountry(request, response);
        const result = await mockRequestMetarCategory_local.mock.results[0].value;
        console.log(result);
        expect(mockRequestMetarCategory_local).toBeCalledTimes(1);
    });
});
