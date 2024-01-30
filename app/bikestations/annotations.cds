using StationsService as service from '../../srv/stations-service';
using from '../stations/annotations';


annotate service.Stations with @(

    UI.PresentationVariant                              : {
        $Type         : 'UI.PresentationVariantType',
        GroupBy       : [location, ],
        Total         : [count, ],
        Visualizations: [
            '@UI.LineItem',
            '@UI.Chart#alpChart',
        ],
    },

    UI.LineItem                                         : [
        {
            $Type: 'UI.DataField',
            Label: 'Station',
            Value: location,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Maximal Capacity',
            Value: maxCapacity,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Current bikes available',
            Value: bikesAvailable,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Rent Discount-Level',
            Value: rentIncentiveLevel.level,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Return Discount-Level',
            Value: returnIncentiveLevel.level,
        },
    ],

    UI.Chart #alpChart                                  : {
        $Type          : 'UI.ChartDefinitionType',
        Title          : 'Overview of Bike Stations',
        ChartType      : #Column,
        Dimensions     : [location, ],
        DynamicMeasures: ['@Analytics.AggregatedProperty#numberofbikes', ],
    },

    Analytics.AggregatedProperty #numberofbikes         : {
        Name                : 'NumberBikes',
        AggregationMethod   : 'sum',
        AggregatableProperty: bikesAvailable,
        ![@Common.Label]    : 'Number of Bikes'
    },

    Analytics.AggregatedProperty #numberofrentedbikes   : {
        Name                : 'NumberOfRentedBikes',
        AggregationMethod   : 'sum',
        AggregatableProperty: rentedCount,
        ![@Common.Label]    : 'Number of Rented Bikes'
    },

    Analytics.AggregatedProperty #numberofstationedbikes: {
        Name                : 'NumberOfStationedBikes',
        AggregationMethod   : 'sum',
        AggregatableProperty: stationedCount,
        ![@Common.Label]    : 'Number of Stationed Bikes'
    },
);

annotate service.Stations with @(UI.FieldGroup #Station: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            Value: location,
            Label: 'Location'
        },
        {
            Label: 'Maximal Capacity',
            Value: maxCapacity,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Current bikes available',
            Value: bikesAvailable,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Rent Incentive Level',
            Value: rentIncentiveLevel.level,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Return Incentive Level',
            Value: returnIncentiveLevel.level,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Redistribution ongoing',
            Value: redistributionActive,
        },
    ],
}, );


//Object Page

annotate service.Bikes with @(UI.LineItem #Bikes: [
    {
        $Type: 'UI.DataField',
        Label: 'Bike Name',
        Value: name,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Bike Type',
        Value: type,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Bike Status',
        Value: status,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Bike Kilometers',
        Value: kilometers,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Bike Incentive Level',
        Value: incentiveLevel.level,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Discount Rate',
        Value: incentiveLevel.discountRate,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Bonus Minutes',
        Value: incentiveLevel.bonusMinutes,
    },
], );

annotate service.Stations with @(UI.Facets: [

    {
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Station',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target: 'bikes/@UI.LineItem#Bikes',
    },
]);

// annotate service.Stations with {
//     @Common.Label: 'Location'
//     location
// };
