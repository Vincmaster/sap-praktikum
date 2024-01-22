using {ibike.db as db} from '../db/schema';

service StationsService {

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
                'location'
            ],
            AggregatableProperties: [
                {Property: count},
                {Property: bikesAvailable}
            ]
        }},
        Common.SemanticKey: [ID]
    )
    entity Stations as select from db.Stations{
        *, 
        1 as count: Integer
    };
    entity Workers as select from db.Workers;
    entity Incentives as select from db.Incentives;
    entity LowStations as select from db.Stations where bikesAvailable < 10; 
}