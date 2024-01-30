using DashboardService as service from '../../srv/dashboard-service';

annotate service.RedistributionTask with @(



    UI.PresentationVariant                         : {
        GroupBy       : [
            assignedWorker_ID,
            status_code
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
            Label : 'Assigned Worker ID',
            Value : assignedWorker_ID,
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
            status_code
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
            },
            {
                Dimension : status_code,
                Role : #Category
            }, 
        ]
    },
);

//Object Page

annotate service.RedistributionTask with @(
    UI.FieldGroup #Task : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Status',
                Value : status_code,
            },     
            {
                $Type : 'UI.DataField',
                Label : 'Assigned Worker ',
                Value : assignedWorker.name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Assigned Worker ID',
                Value : assignedWorker_ID,
            },           
            {
                $Type : 'UI.DataField',
                Label : 'Created at',
                Value : createdAt,
            },

        ],
    },        
);

annotate service.TaskItems with @(
        UI.LineItem: [
        {
            $Type : 'UI.DataField',
            Label : 'From',
            Value : departure_ID,
        },        
        {
            $Type : 'UI.DataField',
            Label : 'To',
            Value : target_ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike ID',
            Value : bike.ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike Name',
            Value : bike.name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike Type',
            Value : bike.type,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike Status',
            Value : bike.status,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike Kilometers',
            Value : bike.kilometers,
        },
    ],  
);

annotate service.RedistributionTask with @(
    UI.Facets : [

    {
        $Type : 'UI.ReferenceFacet',
        Target : '@UI.FieldGroup#Task',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target : 'taskItems/@UI.LineItem',
    },
]
);