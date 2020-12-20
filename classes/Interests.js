const Coordinates = require('./Coordinates')

const availableInterests = {
    sightseeing: {
        searchQuery: 'sightseeing',
        searchType: 'tourist_attraction',
        validTypes: ['tourist_attraction'],
        invalidTypes: ['travel_agency'],
    },
    hiking: {
        searchQuery: 'hiking trails',
        searchType: '',
        validTypes: ['point_of_interest', 'park'],
        invalidTypes: ['tourist_attraction', 'travel_agency']
    },
    shopping: {
        searchQuery: 'shopping mall',
        searchType: 'shopping_mall',
        validTypes: ['shopping_mall', 'travel_agency'],
        invalidTypes: [],
    },
    boating: {
        searchQuery: 'boating',
        searchType: 'point_of_interest',
        validTypes: ['point_of_interest'],
        invalidTypes: ['travel_agency', 'mosque'],
    },
    historical: {
        searchQuery: 'historical',
        searchType: '',
        validTypes: ['point_of_interest', 'travel_agency'],
        invalidTypes: [],
    },
    entertainment: {
        searchQuery: 'entertainment',
        searchType: '',
        validTypes: ['point_of_interest'],
        invalidTypes: ['travel_agency'],
    },
    wildlife: {
        searchQuery: 'zoo',
        searchType: '',
        validTypes: ['zoo'],
        invalidTypes: ['travel_agency'],
    },
    museums: {
        searchQuery: 'museums',
        searchType: 'museum',
        validTypes: ['museum'],
        invalidTypes: ['travel_agency'],
    },
    lakes: {
        searchQuery: 'lakes',
        searchType: '',
        validTypes: ['natural_feature', 'park'],
        invalidTypes: ['travel_agency']
    }
}

class Interests{

    constructor(hobbies) {
        this.hobbies = hobbies
    }

    async getPlaceRecommendations(coordinates){
        const coordinate = new Coordinates(coordinates)
        const recommendedPlaces = []
        // Find places of interest according to each hobby
        for(const hobby of this.hobbies){
            const places = await coordinate.getNearbyPlaces(availableInterests[hobby].searchQuery,
                15, availableInterests[hobby].searchType)
            const filteredPlaces = []
            places.forEach((place, index)=>{
                // Filter out places according to relevant place types.
                if(place.types.some(r=> availableInterests[hobby].validTypes.indexOf(r) >= 0) &&
                    !place.types.some(r=> availableInterests[hobby].invalidTypes.indexOf(r) >= 0) &&
                    place.user_ratings_total > 3 && place.rating>2){
                    filteredPlaces.push({...place, score: place.user_ratings_total*place.rating*(1/(index+1)), matches: hobby}) //Calculate places score by total ratings * rating.
                }
            })
            recommendedPlaces.push(...filteredPlaces)
        }
        // Sort Places according to their score.
        recommendedPlaces.sort((a, b)=>{
            return b.score - a.score
        })
        return recommendedPlaces
    }
}

module.exports = Interests
