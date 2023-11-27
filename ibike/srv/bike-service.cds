using {ibike.db as db} from '../db/schema';

service BikeService {

    entity Bikes as projection on db.Bikes;

    event bikeRented : {
        bikeId : UUID
    }

    event bikeReturned : {
        bikeId : UUID
    }

}
