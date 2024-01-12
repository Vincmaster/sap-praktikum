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
                'ID',
                'createdAt',
                'createdBy'
            ],
            AggregatableProperties: [
                {Property: ID},
                {Property: assignedWorker.name},
                {Property: status_code}
            ]
        }},
        Common.SemanticKey: [ID]
    )
    entity RedistributionTask as select from db.RedistributionTasks;
    entity Stations as select from db.Stations;
    entity Workers as select from db.Workers;
    entity LowStations as select from db.Stations where bikesAvailable < 10; 
}