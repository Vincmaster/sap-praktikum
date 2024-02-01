const cds = require("@sap/cds")
const log = cds.log("ibike")
const { updateRentIncentiveLevel, updateReturnIncentiveLevel, updateBikeIncentiveLevels } = require('./incentive-functions.js')

class BikeService extends cds.ApplicationService {
  async init() {
    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities

    const messaging = await cds.connect.to("messaging")

    // Event: A customer rents a bike from a station
    messaging.on("TUM/ibike/em/bikes/rented", async (event) => {
      console.log("*** Start of bike rental event handling. ***")

      console.log("event:", event)

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeID })
      console.log("bike:", bike)

      const station = await SELECT.one.from(Stations).where({ ID: event.data.stationID })
      console.log("station:", station)

      if (bike && station) {
        // Set status to "rented" and decrease bikesAvailable in this station by 1
        await UPDATE(Bikes).set({ status: "rented" }).where({ ID: event.data.bikeID })
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable - 1").where({ ID: event.data.stationID })

        // *** Start of redistribution logic ***

        // Determine how many bikes are available in this station
        let bikesCount = await SELECT.from(Bikes).where({ currentStation_ID: event.data.stationID, status: 'stationed' }).columns('count(1) as count')
        bikesCount = bikesCount[0].count
        console.log("bikesCount:", bikesCount)

        // Define relative and absolute threshold to check if the redistribution logic is triggered
        const redistrThresholdAbs = 5
        const redistrThresholdRel = 0.2

        // Redistribution is triggered when there are either <= 5 bikes in the station or <= 20% of the station's max capacity
        let thresholdMet = bikesCount <= redistrThresholdAbs || bikesCount <= station.maxCapacity * redistrThresholdRel
        // Additionally, we want to have only 1 active redistribution task at a time
        if (thresholdMet && !(station.redistributionActive)) {
          console.log("*** Redistribution Logic is triggered ***")

          // Step XX: Determine how many bikes should be redistributed to this station
          // Define constants for how many bikes should be redistributed. We decided to redistribute either 5 bikes or so many that the station gets "filled up" to 40% of its max capacity
          const minBikesToRedistribute = 5
          const fillUpPercentage = 0.4
          // Determine how many bikes are "missing" in the station to reach 40% of max capacity
          const missingBikes = Math.ceil(station.maxCapacity * fillUpPercentage) - bikesCount

          // Pick whatever of the two options is higher
          const numOfBikesToRedistribute = Math.max(minBikesToRedistribute, missingBikes)
          console.log("numOfBikesToRedistribute:", numOfBikesToRedistribute)

          // Step XX: Determine all stations from which we can possibly transfer bikes to our target station, such that no new redistribution task would be triggered in these stations when we take away bikes from them.
          // --> Condition: After redistribution, at least 5 bikes and 20% of max Capcity should be left over
          const candidateStations = await SELECT.from(Stations)
            .where("ID !=", event.data.stationID)
            .and(
              `bikesAvailable - ${numOfBikesToRedistribute} > ${redistrThresholdAbs} AND bikesAvailable - ${numOfBikesToRedistribute} > maxCapacity * ${redistrThresholdRel}`
            )
          console.log("candidateStations:", candidateStations)

          // Step XX: For every station, calculate the distance to our target station
          // This will be an array ob objects. Each object will have 2 attributes: candidateStation and distance
          let stationDistances = []
          let mockedStationDistances = []

          // We use this HANA specific key later on to access the numeric value of the distance object(s)
          const key = 'POINTLOCATION.ST_DISTANCE(ST_POINT(:1))'
          let errorOcurred = false
          const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(NEW ST_POINT(?)) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?`

          for (const candidateStation of candidateStations) {
            console.log("Entering a new iteration of candidateStations loop ...")
            console.log("current candidate station:", candidateStation.location)

            try {
              const queryResult = await cds.run(distanceQuery, [station.pointLocation, candidateStation.ID])
              // queryResult is an array that contains the distance (as an object)
              const distance = queryResult[0]
              console.log("distance (as an object):", distance)
              console.log("distance (numeric value only):", distance[key])
              stationDistances.push({ candidateStation, distance })
            } catch (error) {
              console.error("An error occured while using HANA spatial functionality.Proceed with mocked spatial data.")
              const distance = Math.abs(station.mockedPointLocation - candidateStation.mockedPointLocation)
              console.log("mocked distance:", distance)
              mockedStationDistances.push({ candidateStation, distance })
              errorOcurred = true
            }
          }

          let nearestStation
          if (!errorOcurred) {
            console.log("stationDistances:", stationDistances)
            // Step XX: Sort stations (smallest distance first)
            stationDistances.sort((a, b) => a.distance[key] - b.distance[key])
            console.log("stationDistances sorted:", stationDistances)

            nearestStation = stationDistances[0].station
            console.log("nearestStation:", nearestStation.location, nearestStation.ID)
            console.log("Distance to target station:", stationDistances[0].distance[key])
          }
          else {
            console.log("mockedStationDistances:", mockedStationDistances)
            // To simplyfy the remaining code, assign the content of mcokedstationDistances to stationdistances
            stationDistances = mockedStationDistances
            console.log("Assigned the content of mockedStationDistances to stationDistances")
            // Step XX: Sort stations (smallest distance first)
            stationDistances.sort((a, b) => a.distance - b.distance)
            console.log("stationDistances sorted:", stationDistances)

            nearestStation = stationDistances[0].candidateStation
            console.log("nearestStation:", nearestStation.location, nearestStation.ID)
            console.log("Distance to target station:", stationDistances[0].distance)
          }

          console.log(numOfBikesToRedistribute, "bikes will be redistributed from", nearestStation.location, "to", station.location)

          /* Step XX: Choose a worker randomly to assign him or her the redistribution task later on
             for the final presentation, wet set the variable "demo" to true to assign the task to a specific worker
             so we can control which worker gets assigned the task. This ensures a smooth presentation for our listeners. */
          const demo = true

          const allWorkers = await SELECT.from(Workers)
          console.log("allWorkers:", allWorkers)

          let chosenWorker

          if (demo) {
            chosenWorker = allWorkers.find(worker => worker.name === "a.heckl@hotmail.de")
          }
          else {
            const busyWorkersIDs = await SELECT.from(RedistributionTasks)
              .columns('assignedWorker_ID')
              .where({ status_code: 'OPEN' })
              .or({ status_code: 'IN_PROGRESS' })
            console.log("busyWorkersIDs:", busyWorkersIDs)

            // Extract IDs from busyWorkersIDs
            const busyWorkerIdList = busyWorkersIDs.map(worker => worker.assignedWorker_ID)
            console.log("busyWorkerIdList:", busyWorkerIdList)

            // Filter allWorkers to exclude busy workers
            const nonBusyWorkers = allWorkers.filter(worker => !busyWorkerIdList.includes(worker.ID))
            console.log("Available Workers:", nonBusyWorkers)

            // If all workers are busy, choose one randomly from all the workers
            // else, choose one randomly from the non-busy workers     
            if (nonBusyWorkers.length === 0) {
              chosenWorker = allWorkers[Math.floor(Math.random() * allWorkers.length)]
            } else {
              chosenWorker = nonBusyWorkers[Math.floor(Math.random() * nonBusyWorkers.length)]
            }
            console.log("chosenWorker:", chosenWorker)
          }

          // Create the description of the task
          const description = `Move ${numOfBikesToRedistribute} bikes from ${nearestStation.location} to ${station.location}`

          // Step XX: Create a new redistribution task
          const redistributionTask = await INSERT.into(RedistributionTasks).entries({
            status_code: "OPEN",
            assignedWorker_ID: chosenWorker.ID,
            description: description
          })
          console.log("A new redistribution task with the following ID was created:", redistributionTask.results[0].values[3])

          // Step XX: Set redistributionActive to true to avoid having multiple tasks for the same station at the same time
          await UPDATE(Stations).set({ redistributionActive: true }).where({ ID: station.ID })
          console.log("redistributionActive was set to true.")

          // Step XX: Choose the bikes that should be transferred to target station (just take the first n ones, where n = numOfBikesToRedistribute)
          const bikesToRedistribute = await SELECT.from(Bikes)
            .where({ currentStation_ID: nearestStation.ID, status: "stationed" })
            .limit(numOfBikesToRedistribute)
          console.log("bikesToRedistribute:", bikesToRedistribute)

          // Step XX: Create one task item for each bike
          let i = 1
          for (const bikeToRedistribute of bikesToRedistribute) {
            console.log(`Creating a new taskItem for the ${i}. bike that should be redistributed ...`)
            const taskItem = await INSERT.into(TaskItems).entries({
              bike_ID: bikeToRedistribute.ID,
              departure_ID: nearestStation.ID,
              target_ID: station.ID,
              task_ID: redistributionTask.results[0].values[3],
            })
            console.log("taskItem created:", taskItem.results[0].values)

            // Set the status of the bike to "reservedForRedis" such that the customers cannot rent it
            await UPDATE(Bikes)
              .set({ status: "reservedForRedis" })
              .where({ ID: bikeToRedistribute.ID })

            await UPDATE(Stations).set("bikesAvailable = bikesAvailable - 1").where({ ID: bikeToRedistribute.currentStation_ID })

            i++
          }
          console.log("Finished creating a task item for each bike to be redistributed.")

          // Due to the redistribution task that has just been created, bikesAvailable has changed in the departure station. Thus, we need to update the 3 incentive levels there.
          // Update incentive to rent bikes from there
          await updateRentIncentiveLevel(nearestStation, Stations)

          // Update incentive to return bikes to this station
          await updateReturnIncentiveLevel(nearestStation, Stations)

          // Update incentives on bike level (incentive to rent bikes with less kilometers)
          await updateBikeIncentiveLevels(nearestStation, Bikes)

        } else {
          console.log("Redistribution logic was not triggered. The threshold was not met and/or there is already another active redistribution task for this station.")
        }
        // *** End of redistribution logic ***

        // Update incentive to rent bikes from this station
        await updateRentIncentiveLevel(station, Stations)

        // Update incentive to return bikes to this station
        await updateReturnIncentiveLevel(station, Stations)

        // Update incentives on bike level (incentive to rent bikes with less kilometers)
        await updateBikeIncentiveLevels(station, Bikes)

      } else {
        if (!bike) {
          console.log("No bike found with ID:", event.data.bikeID)
        }

        if (!station) {
          console.log("No station found with ID:", event.data.stationID)
        }

        console.log("Event cannot be handled as bike and/or station could not be found in the database.")
      }
      console.log("*** Bike rental event handling finished. ***")
    })

    // Event: A Customer returns a bike to a station
    messaging.on("TUM/ibike/em/bikes/returned", async (event) => {
      console.log("*** Start of bike return event handling. ***")

      console.log("event:", event)

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeID })
      console.log("bike:", bike)

      const station = await SELECT.one.from(Stations).where({ ID: event.data.stationID })
      console.log("station:", station)

      if (bike && station) {
        // Generate a random number between 1 and 50 for simulating kilometers driven by the customer
        const drivenKilometers = Math.floor(Math.random() * 50) + 1
        console.log("drivenKilometers:", drivenKilometers)

        // Increment the total kilometers of the bike with the random value
        const newTotalKilometers = (bike.kilometers || 0) + drivenKilometers
        console.log("newTotalKilometers:", newTotalKilometers)

        // Update status, current station and kilometers
        await UPDATE(Bikes)
          .set({ status: "stationed", currentStation_ID: event.data.stationID, kilometers: newTotalKilometers })
          .where({ ID: event.data.bikeID })

        // Update bikes available
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable + 1").where({ ID: event.data.stationID })

        // Update incentive to rent bikes from this station
        await updateRentIncentiveLevel(station, Stations)

        // Update incentive to return bikes to this station
        await updateReturnIncentiveLevel(station, Stations)

        // Update incentives on bike level (incentive to rent bikes with less kilometers)
        await updateBikeIncentiveLevels(station, Bikes)

      } else {
        if (!bike) {
          console.log("No bike found with ID:", event.data.bikeID)
        }

        if (!station) {
          console.log("No station found with ID:", event.data.stationID)
        }

        console.log("Event cannot be handled as bike and/or station could not be found in the database.")
      }
      console.log("*** Bike return event handling finished. ***")
    })

    return super.init()
  }
}

module.exports = { BikeService }
