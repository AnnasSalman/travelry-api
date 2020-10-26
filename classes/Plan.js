const Hotel = require('../models/hotel')

class Plan{
    get days() {
        return this._days;
    }

    set days(value) {
        this._days = value;
    }

    get budget() {
        return this._budget;
    }

    set budget(value) {
        this._budget = value;
    }

    get route() {
        return this._route;
    }

    set route(value) {
        this._route = value;
    }

    get hotelDistanceSmallWeight() {
        return this._hotelDistanceSmallWeight;
    }

    set hotelDistanceSmallWeight(value) {
        this._hotelDistanceSmallWeight = value;
    }

    get hotelDistanceMediumWeight() {
        return this._hotelDistanceMediumWeight;
    }

    set hotelDistanceMediumWeight(value) {
        this._hotelDistanceMediumWeight = value;
    }

    get hotelDistanceLargeWeight() {
        return this._hotelDistanceLargeWeight;
    }

    set hotelDistanceLargeWeight(value) {
        this._hotelDistanceLargeWeight = value;
    }

    get hotelDistanceSmall() {
        return this._hotelDistanceSmall;
    }

    set hotelDistanceSmall(value) {
        this._hotelDistanceSmall = value;
    }

    get hotelDistanceMedium() {
        return this._hotelDistanceMedium;
    }

    set hotelDistanceMedium(value) {
        this._hotelDistanceMedium = value;
    }

    get hotelDistanceLarge() {
        return this._hotelDistanceLarge;
    }

    set hotelDistanceLarge(value) {
        this._hotelDistanceLarge = value;
    }
    //Budget in Rupees
    constructor(days, budget, route) {
        this._days = days;
        this._budget = budget;
        this._route = route;
        this._hotelDistanceSmallWeight = 60;
        this._hotelDistanceMediumWeight = 30;
        this._hotelDistanceLargeWeight = 10;
        this._hotelDistanceSmall = 1500;
        this._hotelDistanceMedium = 2500;
        this._hotelDistanceLarge = 4000;
    }

    async calculatePlaceStaysProbability (lat, lng) {
        try{
            const hotelsClose = await Hotel.find().getNearbyHotels(lat, lng, this._hotelDistanceSmall)
            const length1 = hotelsClose.length
            const hotelsMedium = await Hotel.find().getNearbyHotels(lat, lng, this._hotelDistanceMedium)
            const length2 = hotelsMedium.length
            const hotelsFar = await Hotel.find().getNearbyHotels(lat, lng, this._hotelDistanceLarge)
            const length3 = hotelsFar.length
            return (length1*(this.hotelDistanceSmallWeight/100))+(length2*(this.hotelDistanceMediumWeight/100))+(length3*(this.hotelDistanceLargeWeight/100))
        }
        catch(e){
            return e
        }
    }

    calculateStaysAndStops (ratios) {
        let totalTravelTime = 0
        const totalTourTime = this._days*24*60*60
        this._route.forEach((location)=>{
            totalTravelTime += location.duration.value
        })
        const tourTimeWithOutTravel = totalTourTime - totalTravelTime
        const stays = ratios.map((ratio)=>(
            Math.floor((tourTimeWithOutTravel*ratio)/(24*60*60))
        ))
        let stayTime = 0
        stays.forEach((stay)=>{
            stayTime += stay*24*60*60
        })
        const totalDaysArray = []
        stays.forEach((stay, index)=>{
            if(index === 0){
                totalDaysArray.push(stay)
            }
            else{
                totalDaysArray.push(stay + totalDaysArray[index-1])
            }
        })
        const tourDays = totalDaysArray.map((day, index)=>{
            if(day === 0){
                return [1]
            }
            else{
                const temp = []
                for(let i = totalDaysArray[index-1]+1; i<=totalDaysArray[index]+1; i++){
                    if (i !== 0){
                        temp.push(i)
                    }
                }
                return temp
            }
        })
        const surplusTime = totalTourTime - (totalTravelTime + stayTime)
        return ({
            route: this._route.map((location, index)=>{
                return(
                    {...location,
                        stayDuration: stays[index],
                        tourDays: tourDays[index]
                    }
                )
            })
        })
    }

    async generateTour () {
        try{
            const weights = [0]
            const ratios = []
            let sum = 0

            for(let i=1; i<this._route.length; i++){
                const weight = await this.calculatePlaceStaysProbability(this.route[i].geometry.coordinates.lat,this.route[i].geometry.coordinates.lng)
                sum+=weight
                weights.push(weight)
            }
            weights.forEach((weight)=>{
                ratios.push(weight/sum)
            })
            return this.calculateStaysAndStops(ratios)
        }
        catch(e){
            return e
        }
    }


}

module.exports = Plan
