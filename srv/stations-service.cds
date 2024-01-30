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
            GroupableProperties   : ['location'],
            AggregatableProperties: [
                {Property: count},
                {Property: bikesAvailable},
                {Property: rentedCount},
                {Property: stationedCount},
                {Property: reservedCount},
                {Property: redistributingCount}
            ]
        }},
        Common.SemanticKey: [ID]
    )
    entity Stations   as
        select from db.Stations as station
        left join (
            select
            currentStation.ID as currentStation_ID,
            status            as status,
            count(ID)         as rentedCount    : Integer
            from db.Bikes group by currentStation.ID, status
        ) as rentedBikes
            on  rentedBikes.currentStation_ID = station.ID
            and rentedBikes.status            = 'rented'
        left join (
            select
            currentStation.ID as currentStation_ID,
            status            as status,
            count(ID)         as stationedCount : Integer
            from db.Bikes group by currentStation.ID, status
        ) as stationedBikes
            on  stationedBikes.currentStation_ID = station.ID
            and stationedBikes.status            = 'stationed'
        left join (
            select
            currentStation.ID as currentStation_ID,
            status            as status,
            count(ID)         as reservedCount    : Integer
            from db.Bikes group by currentStation.ID, status
        ) as reservedBikes
            on  reservedBikes.currentStation_ID = station.ID
            and reservedBikes.status            = 'reservedForRedis'
        left join (
            select
            currentStation.ID as currentStation_ID,
            status            as status,
            count(ID)         as redistributingCount    : Integer
            from db.Bikes group by currentStation.ID, status
        ) as redistributingBikes
            on  redistributingBikes.currentStation_ID = station.ID
            and redistributingBikes.status            = 'redistributing'
        {
            station.ID,
            station.location,
            station.maxCapacity,
            station.bikesAvailable,
            rentIncentiveLevel,
            returnIncentiveLevel,
            bikes,
            redistributionActive,
            1                 as count          : Integer,
            case
                when
                    (
                        rentedBikes.rentedCount is null
                    )
                then
                    0
                else
                    rentedBikes.rentedCount
            end               as rentedCount    : Integer @title: 'Rented Bikes',

            case
                when
                    (
                        stationedBikes.stationedCount is null
                    )
                then
                    0
                else
                    stationedBikes.stationedCount
            end               as stationedCount : Integer @title: 'Available Bikes',

            case
                when
                    (
                        reservedBikes.reservedCount is null
                    )
                then
                    0
                else
                    reservedBikes.reservedCount
            end               as reservedCount    : Integer @title: 'Reserved Bikes',
            case
                when
                    (
                        redistributingBikes.redistributingCount is null
                    )
                then
                    0
                else
                    redistributingBikes.redistributingCount
            end               as redistributingCount    : Integer @title: 'Redistributing Bikes',
        };

    entity Workers    as projection on db.Workers;
    entity Incentives as projection on db.Incentives;
    entity Bikes      as projection on db.Bikes;
}
