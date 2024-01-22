using {
    cuid,
    managed,
    sap.common.CodeList
} from '@sap/cds/common';



namespace ibike.db;

entity Bikes : cuid, managed {
    name : String(128) not null  @mandatory;
    type : String(20);
    price : Int32;
    status : String(20);
    currentStation: Association to Stations;
    kilometers: Int32;
    incentiveLevel: Association to Incentives;
}

entity Stations : cuid, managed {
    location : String(128) not null @mandatory;
    maxCapacity : Int32;
    bikesAvailable : Int32;
    bikes : Association to many Bikes on bikes.currentStation = $self;
    returnIncentiveLevel : Association to Incentives;
    rentIncentiveLevel : Association to Incentives;
    pointLocation : hana.ST_POINT;
}

entity Incentives : cuid, managed {
    level : String(10);
    discountRate : Int32;
    bonusMinutes : Int32;
    // station: Association to many Stations on station.incentiveLevel = $self;
}

entity TaskItems : cuid, managed {
    bike : Association to Bikes;
    departure : Association to Stations;
    target : Association to Stations;
    task : Association to RedistributionTasks;
}

entity RedistributionTasks : cuid, managed {
    status : Association to TaskStatus;
    assignedWorker : Association to Workers;
    taskItems : Association to many TaskItems on taskItems.task = $self;
}

entity TaskStatus : CodeList {
    key code : String(20);
}

entity Workers : cuid, managed {
    name : String(128);
    email : String(128);
    tasks : Association to many RedistributionTasks on tasks.assignedWorker = $self;
}