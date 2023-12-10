// TODO manchmal backticks, manchmal single quotes, manchmal double quotes --> checken wann was geht
const cds = require("@sap/cds");
const log = cds.log("ibike");

class BikeService extends cds.ApplicationService {
  async init() {
    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities;

    const messaging = await cds.connect.to("messaging");

    messaging.on("TUM/ibike/em/bikes/rented", async (event) => {
      console.log(event);
      log.info("on bikeRented data:", event.data, "headers:", event.headers);

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeId });

      if (bike) {
        // Set status to "rented" and decrease bikesAvailable in this station by 1
        await UPDATE(Bikes).set({ status: "rented" }).where({ ID: event.data.bikeId });
        await UPDATE(Station).set("bikesAvailable = bikesAvailable - 1").where({ ID: event.data.stationId });

        const station = await SELECT.one.from(Station).where({ ID: event.data.stationId });

        if (station) {
          // --- Start of incentive logic (incentive to return bikes to this station)
          const thresholdLow = Math.floor(0.4 * station.maxCapacity); // low incentive to return bike when 40% of max capacity are available
          const thresholdMedium = Math.floor(0.2 * station.maxCapacity);
          const thresholdHigh = Math.floor(0.1 * station.maxCapacity); // high incentive to return bike when only 10% of max capacity are availabe

          let returnIncentiveLevel = "none";
          if (station.bikesAvailable <= thresholdHigh) {
            returnIncentiveLevel = "high";
          } else if (station.bikesAvailable <= thresholdMedium) {
            returnIncentiveLevel = "medium";
          } else if (station.bikesAvailable <= thresholdLow) {
            returnIncentiveLevel = "low";
          }

          // Update the incentive level in the database
          await UPDATE(Stations).set({ returnIncentiveLevel: returnIncentiveLevel }).where({ id: station.ID });
          // --- End of incentive logic

          // --- Start of redistribution logic
          // TODO: prüfen ob die Syntax stimmt mit count (1) und 2 where Bedingungen
          // Determine how many bikes are available in this station
          const bikesCount = await SELECT.count(1)
            .from(Bikes)
            .where({ currentStation: event.data.stationId, status: "available" });

          // Check if redistribution is triggered
          // TODO vlt noch globale Konstanten machen
          if (bikesCount <= 5 || bikesCount <= station.maxCapacity * 0.2) {
            // Determine how many bikes should be redistributed to this station
            // The station should have at least 6 bikes or 40% of its max Capacity after redistribution
            // TODO vlt noch globale Konstanten machen
            let bikesToRedistribute = Math.max(6, Math.ceil(station.maxCapacity * 0.4)) - bikesCount;
            log.info(`Bikes to redistribute: ${bikesToRedistribute}`);

            // Determine all station from which we can possibly transfer bikes to our target station
            // Condition: After redistribution, at least 5 bikes or 20% of max Capcity should be left over
            // TODO: checken ob Syntax stimmt
            const candidateStations = await SELECT.from(Station)
              .where("ID !=", event.data.stationId)
              .and(
                `bikesAvailable - ${bikesToRedistribute} > 5 OR bikesAvailable - ${bikesToRedistribute} > maxCapacity * 0.2`
              );

            // For every station, calculate the distance to our target station
            const stationDistances = [];
            for (const candidateStation of candidateStations) {
              // TODO: define "pointLocation" attribute in schema.cds in station table
              const distance = ST_DISTANCE(station.pointLocation, candidateStation.pointLocation);
              stationDistances.push({ candidateStation, distance });
            }

            // Sort stations (smallest distance first)
            stationDistances.sort((a, b) => a.distance - b.distance);

            const nearestStation = stationDistances[0].station;
            log.info(`Nearest station for redistribution: ${nearestStation.ID}`);
            log.info(`Distance to target station: ${stationDistances[0].distance}`);

            // choose a worker randomly to assign him the redistribution task later on
            // TODO checken ob syntax richtig ist
            const workers = await SELECT.from(Workers);
            const worker = workers[Math.floor(Math.random() * workers.length)];
            log.info(`Assigned worker: ${worker.ID}`);

            // Create Redistribution Task and write it to database
            // TODO checken ob Syntax stimmt
            const redistributionTask = await INSERT.into(RedistributionTasks).entries({
              status: "Pending",
              assignedWorker: randomWorker.ID,
            });

            // Choose the bikes that should be transferred to target station
            const bikesForRedistribution = await SELECT.from(Bikes)
              .where("currentStation =", nearestStation.ID)
              .and("status =", "available")
              .limit(bikesToRedistribute);

            for (const bikeToRedistribute of bikesForRedistribution) {
              // Create one task item for each bike
              const taskItem = await INSERT.into(TaskItems).entries({
                bike: bikeToRedistribute.ID,
                departure: station.ID,
                target: nearestStation.ID,
                task: redistributionTask.ID,
              });
              log.info(`Redistribution Task Item created for Bike ${bikeToRedistribute.ID}: ${taskItem[0].ID}`);
            }
          }
        }
      }
    });

    messaging.on('TUM/ibike/em/bikes/returned', async (event) => {
      console.log('Received event:', event);
      log.info("on bikeReturned data:", event.data, "headers:", event.headers);

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeId });

      // Set status to "available", set new station for the bike, increment bikesAvailale in station table
      if (bike) {
        await UPDATE(Bikes)
          .set({ status: "available", currentStation: event.data.stationId })
          .where({ ID: event.data.bikeId });

        await UPDATE(Station).set("bikesAvailable = bikesAvailable + 1").where({ ID: event.data.stationId });
      }

      const station = await SELECT.one.from(Station).where({ ID: event.data.stationId });
      if (station) {
        // --- incentive logic (incentive to rent bikes from this station)
        const thresholdLow = Math.floor(0.6 * station.maxCapacity); // low incentive to rent bike when 60% of max capacity are available
        const thresholdMedium = Math.floor(0.8 * station.maxCapacity); // medium incentive to rent bikes when 80% of max capacity are available
        const thresholdHigh = Math.floor(0.9 * station.maxCapacity); // high incentive to rent bike when 90% of max capacity are availabe

        let rentIncentiveLevel = "none";
        if (station.bikesAvailable >= thresholdHigh) {
          rentIncentiveLevel = "high";
        } else if (station.bikesAvailable >= thresholdMedium) {
          rentIncentiveLevel = "medium";
        } else if (station.bikesAvailable >= thresholdLow) {
          rentIncentiveLevel = "low";
        }

        // Update the incentive level in database
        await UPDATE(Stations).set({ rentIncentiveLevel: rentIncentiveLevel }).where({ id: station.ID });
      }
    });

    // For this event, 2 distinct cases exist:
    // 1) Worker sets status of task from “OPEN” to “IN_PROGRESS”
    // 2) D) Worker sets status of task from “IN_PROGRESS” to “CLOSED”
    // TODO Event noch erstellen in bike-service.cds und Attributnamen pruefen
    messaging.on("TUM/ibike/em/bikes/taskStatusChanged", async (event) => {
      // Get all task items (i.e. all bikes) that belong to this redistrubtion task
      const taskItems = await SELECT.from(TaskItems).where({ task: event.data.taskId });

      if (event.data.status === "IN_PROGRESS" && event.data.oldStatus === "OPEN") {
        // for every task Item/ bike, set the status to "redistributing" such that it is not vailable for customers to rent
        // and decrease bikesAvailable of the corresponding station by 1
        for (const taskItem of taskItems) {
          await UPDATE(Bikes).set({ status: "redistributing" }).where({ ID: taskItem.bike.ID });

          await UPDATE(Station).set("bikesAvailable = bikesAvailable - 1").where({ ID: taskItem.departure.ID });
        }
      } else if (event.data.status === "DONE" && event.data.oldStatus === "IN_PROGRESS") {
        // for every task Item/ bike, set the status back to "available" such that it can be rented by customers again
        // and increase bikesAvailable of the corresponding station by 1
        for (const taskItem of taskItems) {
          await UPDATE(Bikes)
            .set({ status: "available", currentStation: taskItem.target.ID }) //evtl targetStation statt target, mal in Datamodel schauen
            .where({ ID: taskItem.bike.ID, status: "redistributing" });

          await UPDATE(Station).set("bikesAvailable = bikesAvailable + 1").where({ ID: taskItem.target.ID });
        }
      }
    });

    return super.init();
  }
}

module.exports = { BikeService };
