using {ibike.db as db} from '../db/schema';

service WorkersService {

    entity Bikes as projection on db.Bikes;
    entity Stations as projection on db.Stations;
    entity Incentives as projection on db.Incentives;
    entity Workers as select from db.Workers where Workers.name = $user;    
    entity RedistributionTasks as select from db.RedistributionTasks where assignedWorker.name = $user and status.code != 'DONE' actions {
        action changeStatus();
        action startTask();
    }
    entity TaskItems as projection on db.TaskItems;
    entity TaskStatus as projection on db.TaskStatus;

};