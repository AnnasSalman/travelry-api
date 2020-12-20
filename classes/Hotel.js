const hotelSearch = require('../models/hotel')
const Booking = require('../models/booking')



class Hotel{
    constructor(lat, lng, dateFrom, dateTo) {
        this.lat = lat
        this.lng = lng
        this.dateFrom = dateFrom
        this.dateTo = dateTo
    }

    async searchOneRoom(distanceFromCenter, guests, priceLowerLimit, priceUpperLimit){
        const hotels = await hotelSearch.find().getNearbyHotels(this.lat, this.lng, distanceFromCenter)
        const hotelIdArray = hotels.map((hotelObject)=>(
            hotelObject._id
        ))
        const available  = await Booking.find({
            guestlimit: {$gt: parseInt(guests)-1},
            price: {$gte: priceLowerLimit, $lte: priceUpperLimit},
            bookings: {
                $not: {
                    $elemMatch: {from: {$lt: this.dateFrom.substring(0,10)}, to: {$gt: this.dateTo.substring(0,10)}}
                }
            }
        }).where('hotelid').in(hotelIdArray).exec();
        return {length: available}
    }

    async getBestRoomOptions(priceBudgetPerNight, distanceFromCenter, guests )
    {
        const hotels = await hotelSearch.find().getNearbyHotels(this.lat, this.lng, distanceFromCenter)
        const hotelIdArray = hotels.map((hotelObject)=>(
            hotelObject._id
        ))
        let resultsFound = false
        let round = 1
        let dividedGuests = [guests]
        let matchedRooms = []

        // Find room search type combinations according to guests
        while(resultsFound!==true){
            const rooms = []
            for (const guestAmount of dividedGuests){
                const available  = await Booking.find({
                    guestlimit: {$gt: parseInt(guestAmount)-1},
                    bookings: {
                        $not: {
                            $elemMatch: {from: {$lt: this.dateFrom.substring(0,10)}, to: {$gt: this.dateTo.substring(0,10)}}
                        }
                    },
                    price: {$gte: 0, $lte: priceBudgetPerNight},
                }).where('hotelid').in(hotelIdArray).sort({guest: 1, price: -1}).exec();
                if (available.length>0){
                    rooms.push(available)
                }
            }
            if(rooms.length<round){
                round+=1
                while(dividedGuests.length){
                    dividedGuests.pop()
                }
                for (let i = 0; i < round; i++){
                    if(i===round-1){
                        dividedGuests.push(guests - dividedGuests.reduce(function(a, b){return a + b;}, 0))
                    }
                    else{
                        dividedGuests.push(Math.round(guests/round))
                    }
                }
                console.log(dividedGuests)
            }
            else{
                matchedRooms = rooms
                resultsFound = true
            }
            if(round === guests){
                resultsFound = true
            }
        }

        // Combinations of rooms according to the number of guests
        let roomPackages = []
        hotelIdArray.forEach((hotelId)=>{
            const roomPackage = []
            for(let i = 0; i < matchedRooms.length; i++){
                for(let matchedRoom of matchedRooms[i]){
                    if(matchedRoom.hotelid === hotelId.toString() && !roomPackage.find((roomElement)=>roomElement._id.toString()===matchedRoom._id.toString())){
                        roomPackage.push(matchedRoom)
                        break
                    }
                }
            }
            if(roomPackage.length===matchedRooms.length){
                roomPackages.push(roomPackage)
            }
        })
        console.log(roomPackages)

        // If no rooms with given budget
        if(roomPackages.find(roomPackage => roomPackage.length === 0)){
            roomPackages = await this.getCheapestRoomOptions(distanceFromCenter, guests)
        }

        // If still no cheapest rooms
        if(roomPackages.find(roomPackage => roomPackage.length === 0)){
            roomPackages = []
        }

        return roomPackages
    }

    async getCheapestRoomOptions(distanceFromCenter, guests){
        const hotels = await hotelSearch.find().getNearbyHotels(this.lat, this.lng, distanceFromCenter)
        const hotelIdArray = hotels.map((hotelObject)=>(
            hotelObject._id
        ))
        let resultsFound = false
        let round = 1
        let dividedGuests = [guests]
        let matchedRooms = []

        // Find room search type combinations according to guests
        while(resultsFound!==true){
            const rooms = []
            for (const guestAmount of dividedGuests){
                const available  = await Booking.find({
                    guestlimit: {$gt: parseInt(guestAmount)-1},
                    bookings: {
                        $not: {
                            $elemMatch: {from: {$lt: this.dateFrom.substring(0,10)}, to: {$gt: this.dateTo.substring(0,10)}}
                        }
                    }
                }).where('hotelid').in(hotelIdArray).sort({price: 1}).exec();
                if (available.length>0){
                    rooms.push(available)
                }
            }
            if(rooms.length<round){
                round+=1
                while(dividedGuests.length){
                    dividedGuests.pop()
                }
                for (let i = 0; i < round; i++){
                    if(i===round-1){
                        dividedGuests.push(guests - dividedGuests.reduce(function(a, b){return a + b;}, 0))
                    }
                    else{
                        dividedGuests.push(Math.round(guests/round))
                    }
                }
                console.log(dividedGuests)
            }
            else{
                matchedRooms = rooms
                resultsFound = true
            }
            if(round === guests){
                resultsFound = true
            }
        }

        // Combinations of rooms according to the number of guests
        const roomPackages = []
        hotelIdArray.forEach((hotelId)=>{
            const roomPackage = []
            for(let i = 0; i < matchedRooms.length; i++){
                for(let matchedRoom of matchedRooms[i]){
                    if(matchedRoom.hotelid === hotelId.toString() && !roomPackage.find((roomElement)=>roomElement._id.toString()===matchedRoom._id.toString())){
                        roomPackage.push(matchedRoom)
                        break
                    }
                }
            }
            if(roomPackage.length===matchedRooms.length){
                roomPackages.push(roomPackage)
            }
        })

        return roomPackages

    }

    async findHotelDetailsById(id){
        const hotel = await hotelSearch.findById(id).exec()
        return hotel
    }
}

module.exports = Hotel
