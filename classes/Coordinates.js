const axios = require('axios')

function arePointsNear(checkPoint, centerPoint, km) {
    let ky = 40000 / 360;
    let kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
    let dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    let dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= km;
}

class Coordinates {

    constructor(coordinates) {
        this.coordinates = coordinates
    }

    async getNearbyPlaces(query, radius, type){
        const places = await axios.request({
            method: 'get',
            url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
            params: {
                query: query,
                key: process.env.mapsKey,
                location: this.coordinates.lat + ',' + this.coordinates.lng,
                radius: 3500,
                type: type
            }
        })
        const data = places.data.results
        const placeResults = []
        data.forEach((searchResult)=>{
            const checkPoint = searchResult.geometry.location
            const currentPoint = this.coordinates
            if(arePointsNear(checkPoint, currentPoint, radius)){
                placeResults.push(searchResult)
            }
        })
        return placeResults
    }
}

module.exports = Coordinates
