using StationsService as service from '../../srv/stations-service';

annotate service.Stations with @(
    UI.PresentationVariant                         : {
        $Type : 'UI.PresentationVariantType',
        GroupBy : [
            location,
        ],
        Total : [
            count,
        ],
        Visualizations : [
            '@UI.LineItem',
            '@UI.Chart#Stations',
        ],
    },
        UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Station',
            Value : location,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Maximal Capacity',
            Value : maxCapacity,
        },
                {
            $Type : 'UI.DataField',
            Label : 'Current bikes available',
            Value : bikesAvailable,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Rent Discount-Rate',
            Value : rentIncentiveLevel.discountRate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Return Discount-Rate',
            Value : returnIncentiveLevel.discountRate,
        },
    ],


     Analytics.AggregatedProperty #numberofStations : {
        Name                : 'NumberStations',
        AggregationMethod   : 'sum',
        AggregatableProperty: count,
        ![@Common.Label]    : 'Number of Stations'
    },

    UI.Chart #Stations : {
        $Type : 'UI.ChartDefinitionType',
        Description : 'Overview of Stations',
        Title : 'Overview of Stations',
        ChartType : #Column,
        Dimensions : [
            location,
        ],
        DimensionAttributes : [
            {
                $Type : 'UI.ChartDimensionAttributeType',
                Dimension : location,
                Role : #Category,
            },
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofStations',
        ],
        MeasureAttributes : [
            {
                $Type : 'UI.ChartMeasureAttributeType',
                DynamicMeasure : '@Analytics.AggregatedProperty#numberofStations',
                Role : #Axis1,
            },
        ],
    }, 

);

annotate service.Stations with @(
    UI.Facets : [
    {
        $Type : 'UI.ReferenceFacet',
        Target : '@UI.Chart#Stations',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target : '@UI.LineItem',
    },
    
]
);

annotate service.Stations with @(
        Common.SideEffects: {TargetEntities: ['/StationsService.EntityContainer/Stations']}
    );
