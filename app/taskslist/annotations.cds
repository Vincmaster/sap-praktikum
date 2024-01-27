using WorkersService as service from '../../srv/workers-service';

annotate service.RedistributionTasks with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Task ID',
            Value : ID,
        },{
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : status_code,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Created at',
            Value : createdAt,
        },
        {
            $Type: 'UI.DataFieldForAction',
            Label: 'Change Taskstatus',
            Action: 'WorkersService.changeStatus',
        },
    ]
);

annotate service.TaskItems with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'From',
            Value : departure.location,
        },
        {
            $Type : 'UI.DataField',
            Label : 'To',
            Value : target.location,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Bike',
            Value : bike.name,
        },
    ]
);
annotate service.RedistributionTasks with @(
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : ID,
        },
        TypeName : 'Task',
        TypeNamePlural : 'Tasks',
        Description : {
            $Type : 'UI.DataField',
            Value : status_code,
            
        },
    }
);

annotate service.RedistributionTasks with @(
    UI.FieldGroup #Tasks : {
        $Type : 'UI.FieldGroupType',
            Data : [
                {
                    Value : createdBy,
                    Label : 'created by'
                },
                {
                    Value : createdAt,
                    Label : 'Created at'
                }
            ]

    }
);

annotate service.RedistributionTasks with @(
    UI.Facets : [
    {
        $Type : 'UI.ReferenceFacet',
        Target : '@UI.FieldGroup#Tasks',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target : 'taskItems/@UI.LineItem',
    },
    
]
);
annotate service.RedistributionTasks actions {
    changeStatus @(
        Common.SideEffects: {TargetEntities: ['/WorkersService.EntityContainer/RedistributionTasks']}
    );
};
