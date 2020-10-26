const axios = require('axios')

class Route{

    //set of string coordinates separated by |
    //33.693852,73.065305|33.591368,73.053589|33.916725,73.396740|34.072142,73.386269
    //First one are the source coordinates
    constructor(coordinates) {
        this._coordinates = coordinates
        console.log(coordinates)
    }

    async calculateShortestTrip(){
        try{
            const distances = await axios.request({
                url:'https://maps.googleapis.com/maps/api/distancematrix/json',
                method: 'get',
                params: {
                    origins: this._coordinates,
                    destinations: this._coordinates,
                    key: process.env.mapsKey
                }
            })

            const selectedIndexes = [0]
            let currentIndex = 0
            for(let i = 0; i<distances.data.rows.length-1; i++){
                let lowest = 10000000
                distances.data.rows[currentIndex].elements.forEach((element, index)=>{
                    if (element.distance.value<lowest && element.distance.value!=0 && !selectedIndexes.includes(index)){
                        lowest = element.distance.value
                        currentIndex = index
                    }
                })
                selectedIndexes.push(currentIndex)
            }
            const tour = []
            const coordinateArray = this._coordinates.split('|')
            console.log(selectedIndexes)
            selectedIndexes.forEach((ind,index)=>{
                if(ind===0){
                    tour.push({
                        name: distances.data.destination_addresses[0],
                        type: 'origin',
                        distance: {
                            text: "0 km",
                            value: 0
                        },
                        duration: {
                            text: "0 mins",
                            value: 0
                        },
                        geometry: {
                            coordinates: {
                                lat: coordinateArray[0].split(',')[0],
                                lng: coordinateArray[0].split(',')[1]
                            }
                        }
                    })
                }
                else{
                    console.log(index-1+'-'+ind)
                    const previous = index - 1
                    tour.push({
                        name: distances.data.destination_addresses[ind],
                        type: 'destination',
                        distance: distances.data.rows[selectedIndexes[previous]].elements[ind].distance,
                        duration: distances.data.rows[selectedIndexes[previous]].elements[ind].duration,
                        geometry: {
                            coordinates: {
                                lat: coordinateArray[ind].split(',')[0],
                                lng: coordinateArray[ind].split(',')[1]
                            }
                        }
                    })
                }
            })
            return tour
        }
        catch(e){
            return e
        }
    }
}

module.exports = Route
