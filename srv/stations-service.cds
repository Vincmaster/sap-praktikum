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
    entity Workers as projection on db.Workers;
    entity Incentives as projection on db.Incentives;
    entity Bikes as projection on db.Bikes;
}