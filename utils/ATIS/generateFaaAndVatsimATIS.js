const { generateFAAResponseATIS } = require("./generateFAAResponseATIS");
const VatsimData = require("../Vatsim_data/VatsimData");

module.exports.generateGeneralATIS = async (icao) => {
    const vatsimData = new VatsimData(icao);

    const faaATIS = await generateFAAResponseATIS(icao.toUpperCase());
    const vatsimATIS = await vatsimData.getATIS(icao.toUpperCase());

    const ATIS = {};

    if (!faaATIS.data.includes("NO ATIS found") && !vatsimATIS.includes("No Vatsim Atis Found")) {
        //if both faa atis and vatsim atis exist
        ATIS.faa = faaATIS.data;
        ATIS.vatsim = vatsimATIS;
    } else if (
        faaATIS.data.includes("NO ATIS found") &&
        !vatsimATIS.includes("No Vatsim Atis Found")
    ) {
        //if faa atis not found, but vatsim atis found.
        ATIS.faa = faaATIS.data;
        ATIS.vatsim = vatsimATIS;
    } else if (
        faaATIS.data.includes("NO ATIS found") &&
        vatsimATIS.includes("No Vatsim Atis Found")
    ) {
        //if both faa atis and vatsim atis not found
        ATIS.faa = faaATIS.data;
        ATIS.vatsim = vatsimATIS;
    }

    return ATIS;
};
