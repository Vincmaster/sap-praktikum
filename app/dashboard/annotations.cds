using DashboardService as service from '../../srv/dashboard-service';

annotate service.RedistributionTask with @(

        UI.SelectionFields                             : [
        assignedWorker_ID,
    ],

    UI.PresentationVariant                         : {
        GroupBy       : [
            assignedWorker_ID,
        ],
        Total         : [
            count
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
            Value : assignedWorker_ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Created at',
            Value : createdAt,
        },
    ],


     Analytics.AggregatedProperty #numberofTasks : {
        Name                : 'NumberTasks',
        AggregationMethod   : 'sum',
        AggregatableProperty: count,
        ![@Common.Label]    : 'Number of Tasks'
    },


    UI.Chart :{
    Title : 'Task Chart',
    ChartType : #Column,
    DynamicMeasures    : [
        '@Analytics.AggregatedProperty#numberofTasks',
        ],    
    Dimensions : [
        assignedWorker_ID,
    ],
    MeasureAttributes: [
        {
            DynamicMeasure : '@Analytics.AggregatedProperty#numberofTasks',
            Role : #Axis1
        }
    ],
    DimensionAttributes: [
        {
            Dimension : assignedWorker_ID,
            Role : #Category
        }
    ]
    },
);


