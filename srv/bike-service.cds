using {ibike.db as db} from '../db/schema';

service BikeService {

    entity Bikes as projection on db.Bikes;
    entity Stations as projection on db.Stations;
    entity Incentives as projection on db.Incentives;
    entity Workers as projection on db.Workers;
    entity RedistributionTasks as projection on db.RedistributionTasks;
    entity TaskItems as projection on db.TaskItems;
    entity TaskStatus as projection on db.TaskStatus;

    event bikeRented : {
        bikeId : UUID
    }

    event bikeReturned : {
        bikeId : UUID
    }

}