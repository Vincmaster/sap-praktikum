using {ibike.db as db} from '../db/schema';

service DashboardService {

 @readonly
    @(
        Aggregation       : {ApplySupported: {
            $Type                 : 'Aggregation.ApplySupportedType',
            Transformations       : [
                'aggregate',
                'groupby',
                'concat',
                'identity',
                'filter',
                'search',
                'bottomcount',
                'topcount',
                'orderby',
                'top',
                'skip'
            ],
            GroupableProperties   : [
                'assignedWorker_ID',
                'status_code',
            ],
            AggregatableProperties: [
                {Property: ID},
                {Property: count}
            ]
        }},
        Common.SemanticKey: [ID]
    )
    entity RedistributionTask as select from db.RedistributionTasks {
        *, 
        1 as count: Integer
    };
    entity Stations as select from db.Stations{
        *, 
        1 as count: Integer
    };
    entity Workers as projection on db.Workers;
    entity TaskItems as projection on db.TaskItems;
    entity Bikes as projection on db.Bikes;
}