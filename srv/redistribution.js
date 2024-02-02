const config = require('./config.json')
const { updateRentIncentiveLevel, updateReturnIncentiveLevel, updateBikeIncentiveLevels } = require('./incentive-functions.js')

async function redistributeBikes(station, bikesAvailable, Stations, Bikes, Workers, RedistributionTasks, TaskItems) {
    console.log("*** Start of redistribution logic ***")

    /* First, it we need to determine how many bikes should be redistributed to this station.
       We decided to redistribute either 5 bikes or so many that the station gets "filled up" to 40% of its max capacity (whatever is higher).
       These values are defined in the configfile. */

    // Determine how many bikes are "missing" in the station to reach 40% of max capacity
    const missingBikes = Math.ceil(station.maxCapacity * config.fillUpPercentage) - bikesAvailable

    // Pick whatever of the two options is higher
    const numOfBikesToRedistribute = Math.max(config.minBikesToRedistribute, missingBikes)
    console.log("numOfBikesToRedistribute:", numOfBikesToRedistribute)

    // Determine all stations from which we can possibly transfer bikes to our target station, such that no new redistribution task would be triggered in these stations when we take away bikes from them.
    // --> Condition: After redistribution, more than 5 bikes and 20% of max capacity must be left over.
    const candidateStations = await SELECT.from(Stations)
        .where("ID !=", station.ID)
        .and(
            `bikesAvailable - ${numOfBikesToRedistribute} > ${config.redistrThresholdAbs} AND bikesAvailable - ${numOfBikesToRedistribute} > maxCapacity * ${config.redistrThresholdRel}`
        )
    console.log("candidateStations:", candidateStations)

    // For every station, calculate the distance to the target station (=the station where the customer rented the bike from)
    let stationDistances = [] // This will be an array ob objects. Each object will have 2 attributes: candidateStation and distance
    let mockedStationDistances = [] // We use this array of numbers to mock te distances in case there is an error with the geospatial functionality.

    // We use this HANA specific key later on to access the numeric value of the distance object(s)
    const key = 'POINTLOCATION.ST_DISTANCE(ST_POINT(:1))'
    const distanceQuery = `SELECT "POINTLOCATION".ST_DISTANCE(NEW ST_POINT(?)) FROM "IBIKE_DB_STATIONS" WHERE "ID" = ?`

    let errorOcurred = false // We use this variable to decide whether to use stationDistances or mockedStationDistances

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
        // Sort stations (smallest distance first)
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
        // Sort stations (smallest distance first)
        stationDistances.sort((a, b) => a.distance - b.distance)
        console.log("stationDistances sorted:", stationDistances)

        nearestStation = stationDistances[0].candidateStation
        console.log("nearestStation:", nearestStation.location, nearestStation.ID)
        console.log("Distance to target station:", stationDistances[0].distance)
    }

    console.log(numOfBikesToRedistribute, "bikes will be redistributed from", nearestStation.location, "to", station.location)

    /* Determine which worker to assign the task to.
       For the final presentation, wet set the variable "demo" to true to assign the task to a specific worker
       so we can control which worker gets assigned the task. This ensures a smooth presentation for our listeners.
       Other than that, we determine the workers who are not "busy", i.e. those who do not have an unfinished task currently.
       From these workers, we choose one randomly. If all workers are busy, we choose one randomly from all workers.*/
    const allWorkers = await SELECT.from(Workers)
    console.log("allWorkers:", allWorkers)

    let chosenWorker
    const demo = true

    if (demo) {
        chosenWorker = allWorkers.find(worker => worker.name === config.demoWorker)
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

    // Create the description of the task in the database
    const description = `Move ${numOfBikesToRedistribute} bikes from ${nearestStation.location} to ${station.location}`

    // Create a new redistribution task
    const redistributionTask = await INSERT.into(RedistributionTasks).entries({
        status_code: "OPEN",
        assignedWorker_ID: chosenWorker.ID,
        description: description
    })
    console.log("A new redistribution task with the following ID was created:", redistributionTask.results[0].values[3])

    // Set redistributionActive to true to avoid having multiple tasks for the same station at the same time
    await UPDATE(Stations).set({ redistributionActive: true }).where({ ID: station.ID })
    console.log("redistributionActive was set to true.")

    // Choose the bikes that should be transferred to target station (just take the first n ones, where n = numOfBikesToRedistribute)
    const bikesToRedistribute = await SELECT.from(Bikes)
        .where({ currentStation_ID: nearestStation.ID, status: "stationed" })
        .limit(numOfBikesToRedistribute)
    console.log("bikesToRedistribute:", bikesToRedistribute)

    // Create one task item for each bike
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
    console.log("*** End of redistribution logic ***")

    // Due to the redistribution task that was just created, bikesAvailable has changed in the departure station.
    // Thus, we need to update the 3 incentive types (rent inc. on station level, return inc. on station level and inc. on bike level) there.

    // Update incentive to rent bikes from there
    await updateRentIncentiveLevel(nearestStation, Stations)

    // Update incentive to return bikes to this station
    await updateReturnIncentiveLevel(nearestStation, Stations)

    // Update incentives on bike level (incentive to rent bikes with less kilometers)
    await updateBikeIncentiveLevels(nearestStation, Bikes)
}


module.exports = { redistributeBikes }