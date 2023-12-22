using {ibike.db as db} from '../db/schema';

service DashboardService {

    entity Bikes as projection on db.Bikes;
    entity Stations as projection on db.Stations;
    entity RedistributionTasks as projection on db.RedistributionTasks;
    entity Incentives as projection on db.Incentives;
    entity Workers as projection on db.Workers;
    
}