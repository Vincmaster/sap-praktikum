// TODO manchmal backticks, manchmal single quotes, manchmal double quotes --> checken wann was geht
const cds = require("@sap/cds");
// const cdsHana = require("@sap/cds-hana");
const log = cds.log("ibike");
const hana = require("@sap/cds-hana")

class BikeService extends cds.ApplicationService {
  async init() {
    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities;

    const messaging = await cds.connect.to("messaging");

    // Event: A customer rents a bike from a station
    messaging.on("TUM/ibike/em/bikes/rented", async (event) => {
      const returnIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
      const returnIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
      const returnIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
      const returnIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

      const thresholdLowPercentage  = 0.4
      const thresholdMediumPercentage  = 0.2
      const thresholdHighPercentage  = 0.1

      const redistrThresholdAbs = 20 // reset to 5 TODO
      const redistrThresholdRel = 0.2

      console.log("event:", event);

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeID });
      console.log("bike:", bike)

      const station = await SELECT.one.from(Stations).where({ ID: event.data.stationID });
      console.log("station:", station)

      if (bike) {
        // Set status to "rented" and decrease bikesAvailable in this station by 1
        await UPDATE(Bikes).set({ status: "rented" }).where({ ID: event.data.bikeID });
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable - 1").where({ ID: event.data.stationID });

        if (station) {
          // *** Start of incentive logic (incentive to return bikes to this station) ***

        /*
        Overview of the incentive logic:
        Our goal is to ensure that all stations have sufficient availability of bikes.
        Thus, we want to incentivize customers to rent bikes from stations with many bikes available rather than from stations with only few bikes.
        When a customer rents a bike, there is 1 bike less in the station. 
        Thus, there now may are too few bikes and we might have to increase the incentive to return bikes to this station.
        To this end, we define the following thresholds for the respective incentive levels (none, low, meidum and high):
        1) more than 40% of max capacity available --> incentive level "none"
        2) between 40% and 20% of max capacity available --> incentive level "low"
        3) between 20% and 10% of max capacity available --> incentive level "medium"
        4) between 10% and 0% of max capacity available --> incentive level "high"
         */
          const thresholdLow = Math.floor(thresholdLowPercentage * station.maxCapacity);
          const thresholdMedium = Math.floor(thresholdMediumPercentage * station.maxCapacity);
          const thresholdHigh = Math.floor(thresholdHighPercentage * station.maxCapacity);
          console.log("thresholdLow:", thresholdLow)
          console.log("thresholdMedium:", thresholdMedium)
          console.log("thresholdHigh:", thresholdHigh)

          let returnIncentiveLevelID = returnIncentiveLevelNoneID;
          if (station.bikesAvailable <= thresholdHigh) {
            returnIncentiveLevelID = returnIncentiveLevelHighID;
          } else if (station.bikesAvailable <= thresholdMedium) {
            returnIncentiveLevelID = returnIncentiveLevelMediumID;
          } else if (station.bikesAvailable <= thresholdLow) {
            returnIncentiveLevelID = returnIncentiveLevelLowID;
          }
          console.log("returnIncentiveLevelID:", returnIncentiveLevelID)

          // Update the incentive level in the database
          await UPDATE(Stations).set({ returnIncentiveLevel_ID: returnIncentiveLevelID }).where({ ID: event.data.stationID });
          
          // *** End of incentive logic ***

          // *** Start of redistribution logic ***

          // Determine how many bikes are available in this station
          // TODO: prüfen ob bikesAvailable dann überhaupt nötig ist
          let bikesCount = await SELECT.from(Bikes).where({ currentStation_ID: event.data.stationID, status: 'stationed' }).columns('count(1) as count')
          bikesCount = bikesCount[0].count
          console.log("bikesCount:", bikesCount)

          // Check if redistribution is triggered
          if (bikesCount <= redistrThresholdAbs || bikesCount <= station.maxCapacity * redistrThresholdRel) {
            console.log("*** Redistribution Logic was triggered ***")

            // Step 1: Determine how many bikes should be redistributed to this station
            // The station should have at least 6 bikes or 40% of its max Capacity after redistribution
            const numOfBikesToRedistribute = Math.max(6, Math.ceil(station.maxCapacity * 0.4)) - bikesCount;
            console.log("numOfBikesToRedistribute:", numOfBikesToRedistribute)

            // Step 2: Determine all stations from which we can possibly transfer bikes to our target station
            // Condition: After redistribution, at least 5 bikes or 20% of max Capcity should be left over
            // TODO: checken ob Syntax stimmt
            const candidateStations = await SELECT.from(Stations)
              .where("ID !=", event.data.stationID)
              .and(
                `bikesAvailable - ${numOfBikesToRedistribute} > 5 OR bikesAvailable - ${numOfBikesToRedistribute} > maxCapacity * 0.2`
              );
            console.log("candidateStations:", candidateStations)

            // Step 3: For every station, calculate the distance to our target station
            const stationDistances = [];
            for (const candidateStation of candidateStations) {
              console.log("In candidateStations loop.")
              
              console.log("pointLocation binary:", station.pointLocation.toString())

              // Eigentlich müsste es doch einfach so funktionieren (mit parametrized query):
              // const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(?) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?`
              //const result = await cds.run(distanceQuery, [station.pointLocation, candidateStation.ID]);
              // --> das gibt Error --> SqlError: invalid datatype: Not supported argument type: function st_distance(Point, NString) does not exist.

              // so gibt es zumindest keinen Fehler:
              const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(NEW ST_POINT(?)) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?`
              const result = await cds.run(distanceQuery, [station.pointLocation, candidateStation.ID]);
              // --> 

              console.log("distanceQuery", distanceQuery)
              console.log("result:", result)

              // const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(NEW ST_POINT(${station.pointLocation.toString()})) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ${candidateStation.ID}`;
              // const distanceQuery = `SELECT "LOCATION" FROM "IBIKE_DB_STATIONS" WHERE "ID" = ${candidateStation.ID}`; // DAS FUNKTIONIERT NICHT
              // const distanceQuery = `SELECT "POINTLOCATION" FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?`; // DAS FUNKTIONIERT
              //const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(NEW ST_POINT(?)) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?` //hat zumindest keinen Fehler gegeben
              
              // const result = await cds.run(distanceQuery, [candidateStation.ID]); // DAS FUNKTIONIERT
              // const result = await cds.run(distanceQuery, [station.pointLocation.toString(), candidateStation.ID]); DAS GAB Wrong input for LOb type
              // const result = await cds.run(distanceQuery);
              

              // The result contains the distance
              const distance = result[0];
              console.log(`Distance between Munich and Berlin stations: ${distance} meters`);

              stationDistances.push({ candidateStation, distance });
            }
            console.log("stationDistances:", stationDistances)

            // Step 4: Sort stations (smallest distance first)
            stationDistances.sort((a, b) => a.distance - b.distance);
            console.log("stationDistances sorted:", stationDistances)

            const nearestStation = stationDistances[0].station; //TODO brauchen wir das .station überhaupt?
            console.log("nearestStation:", nearestStation.ID);
            console.log("Distance to target station:", stationDistances[0].distance); // TODO brauchen wir .ditance überhaupt

            // Step 5: Choose a worker randomly to assign him or her the redistribution task later on
            const workers = await SELECT.from(Workers);
            const worker = workers[Math.floor(Math.random() * workers.length)];
            console.log("worker:", worker);

            // Step 5: Create Redistribution Task
            // TODO prüfen ob das Obejkt wirklich erzeugt wird nach insert
            const redistributionTask = await INSERT.into(RedistributionTasks).entries({
              status_code: "OPEN",
              assignedWorker_ID: randomWorker.ID,
            });
            console.log("redistributionTask:", redistributionTask)

            // Step 6: Choose the bikes that should be transferred to target station
            const bikesToRedistribute = await SELECT.from(Bikes)
              .where({currentStation_ID: nearestStation.ID, status: "stationed"})
              .limit(numOfBikesToRedistribute);
            console.log("bikesToRedistribute:", bikesToRedistribute)

            // Step 7: Create one task item for each bike
            for (const bikeToRedistribute of bikesToRedistribute) {
              console.log("Creating a new taskItem ...")
              const taskItem = await INSERT.into(TaskItems).entries({
                bike: bikeToRedistribute.ID,
                departure: nearestStation.ID,
                target: station.ID,
                task: redistributionTask.ID,
              });
              console.log("taskItem created:", taskItem)
            }
          }

          // *** End of redistribution logic ***
        }
      }
    });

    // Event: A Customer returns a bike to a station
    messaging.on("TUM/ibike/em/bikes/returned", async (event) => {
      // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the stations
      const rentIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
      const rentIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
      const rentIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
      const rentIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

      // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the bikes
      const bikeIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
      const bikeIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
      const bikeIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
      const bikeIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

      console.log("event:", event);

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeID });
      console.log("bike:", bike)

      const station = await SELECT.one.from(Stations).where({ ID: event.data.stationID });
      console.log("station:", station)

      // Simulate driven kilometers, set status to "stationed", set new station for the bike and increment bikesAvailable in Stations table
      if (bike) {
        // Generate a random number between 1 and 50 for simulating kilometers driven by the customer
        const drivenKilometers = Math.floor(Math.random() * 50) + 1;
        console.log("drivenKilometers:", drivenKilometers)

        // Increment the total kilometers of the bike with the random value
        const newTotalKilometers = (bike.kilometers || 0) + drivenKilometers;
        console.log("newTotalKilometers:", newTotalKilometers)

        // Update status, current station and kilometers in the database
        await UPDATE(Bikes)
          .set({ status: "stationed", currentStation_ID: event.data.stationID, kilometers: newTotalKilometers })
          .where({ ID: event.data.bikeID });

        // Update bikes available in the database
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable + 1").where({ ID: event.data.stationID });
      }

      if (station) {
        // *** Start of incentive logic on station level (incentive to rent bikes from this station) ***

        /*
        Overview of the incentive logic on station level:
        Our goal is to ensure that all stations have sufficient availability of bikes.
        Thus, we want to incentivize customers to rent bikes from stations with many bikes available rather than from stations with only few bikes.
        To achieve this, we use thresholds based on the max capacity of bikes a station can hold.
        We define the following thresholds for the respective incentive levels (none, low, meidum and high):
        1) less than 60% of max capacity available --> incentive level "none"
        2) between 60% and 80% of max capacity available --> incentive level "low"
        3) between 80% and 90% of max capacity available --> incentive level "medium"
        4) between 90% and 100% of max capacity available --> incentive level "high"
         */
        const thresholdLow = Math.floor(0.6 * station.maxCapacity); // low incentive to rent bike when between 60% and 80% of max capacity are available
        const thresholdMedium = Math.floor(0.8 * station.maxCapacity); // medium incentive to rent bikes when between 80% and 90% of max capacity are available
        const thresholdHigh = Math.floor(0.9 * station.maxCapacity); // high incentive to rent bike when between 90% and 100% of max capacity are availabe
        console.log("thresholdLow:", thresholdLow)
        console.log("thresholdMedium:", thresholdMedium)
        console.log("thresholdHigh:", thresholdHigh)

        let rentIncentiveLevelID = rentIncentiveLevelNoneID;
        if (station.bikesAvailable >= thresholdHigh) {
          rentIncentiveLevelID = rentIncentiveLevelHighID;
        } else if (station.bikesAvailable >= thresholdMedium) {
          rentIncentiveLevelID = rentIncentiveLevelMediumID;
        } else if (station.bikesAvailable >= thresholdLow) {
          rentIncentiveLevelID = rentIncentiveLevelLowID;
        }
        console.log("rentIncentiveLevelID:", rentIncentiveLevelID)

        // Update the incentive level in database
        await UPDATE(Stations).set({ rentIncentiveLevel_ID: rentIncentiveLevelID }).where({ ID: event.data.stationID });

        // *** End of incentive logic on station level ***

        // *** Start of incentive logic on bike level (incentive to rent bikes that have few kilometers) ***

        /*
        Overview of the incentive logic on bike level:
        Our goal is to achieve an even utilization of the bikes to reduce overall maintenance costs.
        Thus, we want to incentivize customers to rent bikes with few kilometers instead of bikes with many kilometers.
        To achieve this, the idea is to sort all bikes by total kilometers driven and partition them into 4 equally sized groups.
        The 25% of bikes with the most kilometers get the incentive level "none".
        The next 25% of bikes get the incentive level "low".
        The next 25% of bikes get the incentive level "medium".
        The 25% of bikes with the least kilometers get the incentive level "high".
         */

        // Step 1: Find all bikes in the station where the customer returned the bike.
        const bikesInStation = await SELECT.from(Bikes).where({ currentStation_ID: event.data.stationID });
        console.log("bikesInStation:", bikesInStation)

        // Step 2: Sort the bikes by kilometers in descending order.
        const sortedBikes = bikesInStation.slice().sort((a, b) => b.kilometers - a.kilometers);
        console.log("sortedBikes:", sortedBikes)

        // Step 3: Calculate the number of bikes in each partition. We partiton the list of bikes into four parts (25% of bikes each) for the four incentive levels (none, low, medium and high).
        const partitionSize = Math.floor(sortedBikes.length / 4);
        console.log("partitionSize:", partitionSize)

        // Step 4: Set incentive levels relatively based on kilometers as described above.
        console.log("Start looping through sortedBikes ...")
        for (let i = 0; i < sortedBikes.length; i++) {
          console.log("Start iteration number", i)
          let bikeIncentiveLevelID = bikeIncentiveLevelNoneID;
          if (i < partitionSize) {
            bikeIncentiveLevelID = bikeIncentiveLevelNoneID;
          } else if (i < partitionSize * 2) {
            bikeIncentiveLevelID = bikeIncentiveLevelLowID;
          } else if (i < partitionSize * 3) {
            bikeIncentiveLevelID = bikeIncentiveLevelMediumID;
          } else {
            bikeIncentiveLevelID = bikeIncentiveLevelHighID;
          }
          console.log("Bike Nr", i, "has bikeIncentiveLevelID", bikeIncentiveLevelID, ".")

          // Step 5: Update the incentive level for the bike in the database.
          await UPDATE(Bikes).set({ incentiveLevel_ID: bikeIncentiveLevelID }).where({ ID: sortedBikes[i].ID });
          console.log("Finished iteration number", i)
        }
        console.log("Finished looping through sortedBikes.")

        // *** End of incentive logic on bike level ***
      }
    });

    // Event: A worker changes the status of a task (either from OPEN to IN_PROGESS or from IN_PROGRESS to DONE)
    messaging.on("TUM/ibike/em/bikes/taskStatusChanged", async (event) => {
      console.log("event:", event);

      // Get all task items (i.e. all bikes) that belong to this redistribution task
      const taskItems = await SELECT.from(TaskItems).where({ task_ID: event.data.taskID });
      console.log("taskItems:", taskItems)

      if (event.data.oldStatus === "OPEN" && event.data.newStatus === "IN_PROGRESS") {
        console.log("Changing status from OPEN to IN_PROGRESS ...")

        // For every task item (i.e., bike), set the status to "redistributing" such that it is not available for customers to rent it
        // and decrease bikesAvailable of the corresponding station by 1.
        for (const taskItem of taskItems) {
          await UPDATE(Bikes).set({ status: "redistributing" }).where({ ID: taskItem.bike_ID });
          await UPDATE(Stations).set("bikesAvailable = bikesAvailable - 1").where({ ID: taskItem.departure_ID });
        }
      } else if (event.data.oldStatus === "IN_PROGRESS" && event.data.newStatus === "DONE") {
        console.log("Changing status from IN_PROGRESS to DONE ...")

        // For every task item (i.e., bike), set the status to "stationed" such that it is available for customers to rent it
        // and set the target station as its new station 
        // and increase bikesAvailable of the corresponding station by 1.
        //TODO: Reset incentive level for receiving station
        for (const taskItem of taskItems) {
          await UPDATE(Bikes)
            .set({ status: "stationed", currentStation: taskItem.target_ID })
            .where({ ID: taskItem.bike_ID});
          await UPDATE(Stations).set("bikesAvailable = bikesAvailable + 1").where({ ID: taskItem.target_ID });
        }
      }
    });

    return super.init();
  }
}

module.exports = { BikeService };
