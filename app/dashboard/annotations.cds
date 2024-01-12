using DashboardService as service from '../../srv/dashboard-service';

annotate service.RedistributionTask with @(

        UI.SelectionFields                             : [
        ID,
        assignedWorker_ID
    ],
    UI.PresentationVariant                         : {
        GroupBy       : [
            ID,
            assignedWorker_ID
        ],
        Total         : [
            status_code,
            ID
        ],
        Visualizations: [
            '@UI.Chart',
            '@UI.LineItem'
        ]
    },
        UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Task ID',
            Value : ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : status_code,
        },
                {
            $Type : 'UI.DataField',
            Label : 'Assigned Worker',
            Value : assignedWorker.name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Created at',
            Value : createdAt,
        },
    ],


     Analytics.AggregatedProperty #numberOfStatusCodes : {
        Name                : 'NumberStatusCodes',
        AggregationMethod   : 'sum',
        AggregatableProperty: status_code,
        ![@Common.Label]    : 'Number of Status Codes'
    },

     Analytics.AggregatedProperty #numberOfAssingedWorkers : {
        Name                : 'NumberAssingedWorkers',
        AggregationMethod   : 'sum',
        AggregatableProperty: assignedWorker_ID,
        ![@Common.Label]    : 'Number of Assigned Workers'
    },


    UI.Chart                                       : {
        Title              : 'Status of Tasks',
        ChartType          : #Column,
        DynamicMeasures    : [
            '@Analytics.AggregatedProperty#numberOfStatusCodes',
            '@Analytics.AggregatedProperty#numberOfAssingedWorkers'
        ],
        Dimensions         : [
            'ID',
            'createdBy'
        ],
        MeasureAttributes  : [{
            DynamicMeasure: '@Analytics.AggregatedProperty#numberOfStatusCodes',
            Role          : #Axis1,
        }],
        DimensionAttributes: [{
            Dimension: ID,
            Role     : #Category
        }]
    }
);
