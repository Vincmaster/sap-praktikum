using WorkerService as service from '../../srv/workers-service';

annotate service.RedistributionTasks with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'status_code',
            Value : status_code,
        },
        {
            $Type : 'UI.DataField',
            Label : 'createdAt',
            Value : createdAt,
        },
    ]
);
