using {ibike.db as db} from '../db/schema';

service DashboardService @(requires: 'operations_manager') {

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
                'status_code'
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
    entity Workers as select from db.Workers;
    entity LowStations as select from db.Stations where bikesAvailable < 10; 
    //entity TasksPerWorker as select from RedistributionTask groupby assignedWorker_ID, status_code
}