const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (originLng, originLat, desLng, desLat) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(originLat - desLat); // deg2rad below
    const dLon = deg2rad(originLng - desLng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(originLat)) *
            Math.cos(deg2rad(desLat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

module.exports = { getDistanceFromLatLonInKm };
