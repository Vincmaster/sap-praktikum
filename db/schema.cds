using {
    cuid,
    managed,
    sap.common.CodeList
} from '@sap/cds/common';

namespace ibike.db;

entity Bikes {
    key id : UUID;
    name : String(128) not null  @mandatory;
    type : String(20);
    price : Int32;
    status : String(20);
    current_station: Association to Station;
}

entity Station {
    key id : UUID;
    location : String(128) not null @mandatory;
    max_capacity : Int32;
    bikes_available : Int32;
    bikes : Association to many Bikes on bikes.current_station = $self;
    incentive_level : Association to Incentive;
}

entity Incentive {
    key id : UUID;
    level : String(10);
    discount_rate : Int32;
    bonus_minutes : Int32;
    station: Association to many Station on station.incentive_level = $self;
}

entity Task_Item {
    key id : UUID;
    bike : Association to Bikes;
    departure : Association to Station;
    target : Association to Station;
    task : Association to Redistribution_Task;

}

entity Redistribution_Task {
    key id : UUID;
    status : String(20);
    tasks_items : Association to many Task_Item on tasks_items.task = $self;
    assigned_worker : Association to Workers;
}

entity Workers {
    key id : UUID;
    name : String(20);
    email : String(128);
    tasks : Association to many Redistribution_Task on tasks.assigned_worker = $self;
}