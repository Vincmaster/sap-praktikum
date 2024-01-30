async function updateReturnIncentiveLevel(station, Stations) {
    /*
    Overview of the return incentive logic on station level:
    Our goal is to ensure that all stations have sufficient availability of bikes.
    Thus, we want to incentivize customers to return bikes to stations with few bikes rather than to stations with many bikes.
    When a customer rents a bike, there is 1 bike less in the station. 
    Thus, there now may are too few bikes and we might have to increase the incentive to return bikes to this station.
    To this end, we define the following thresholds for the respective incentive levels (none, low, medium and high):
    1) more than 40% of max capacity available --> incentive level "none"
    2) between 40% and 20% of max capacity available --> incentive level "low"
    3) between 20% and 10% of max capacity available --> incentive level "medium"
    4) between 10% and 0% of max capacity available --> incentive level "high"
     */

    // Define constants for the respective thresholds as just described
    const thresholdLowPercentage = 0.4
    const thresholdMediumPercentage = 0.2
    const thresholdHighPercentage = 0.1

    const thresholdLow = Math.floor(thresholdLowPercentage * station.maxCapacity)
    const thresholdMedium = Math.floor(thresholdMediumPercentage * station.maxCapacity)
    const thresholdHigh = Math.floor(thresholdHighPercentage * station.maxCapacity)
    console.log("thresholdLow:", thresholdLow)
    console.log("thresholdMedium:", thresholdMedium)
    console.log("thresholdHigh:", thresholdHigh)

    // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the stations
    const returnIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
    const returnIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
    const returnIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
    const returnIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

    // Default incentive level is "none". Adjust with the below if statements
    let returnIncentiveLevelID = returnIncentiveLevelNoneID
    let returnIncentiveLevelName = "none" // This variable is just for logging purposes

    if (station.bikesAvailable - 1 <= thresholdHigh) {
        returnIncentiveLevelID = returnIncentiveLevelHighID
        returnIncentiveLevelName = "high"
    } else if (station.bikesAvailable - 1 <= thresholdMedium) {
        returnIncentiveLevelID = returnIncentiveLevelMediumID
        returnIncentiveLevelName = "medium"
    } else if (station.bikesAvailable - 1 <= thresholdLow) {
        returnIncentiveLevelID = returnIncentiveLevelLowID
        returnIncentiveLevelName = "low"
    }

    console.log("returnIncentiveLevelName:", returnIncentiveLevelName)
    console.log("returnIncentiveLevelID:", returnIncentiveLevelID)

    // Update the incentive level in the database
    try {
        await UPDATE(Stations).set({ returnIncentiveLevel_ID: returnIncentiveLevelID }).where({ ID: station.ID })
        console.log(`Return incentive level updated for station ID: ${station.ID}`)
    } catch (error) {
        console.error("Error updating return incentive level in database:", error)
    }
}


async function updateRentIncentiveLevel(station, Stations) {
    /*
    Overview of the rent incentive logic on station level:
    Our goal is to ensure that all stations have sufficient availability of bikes.
    Thus, we want to incentivize customers to rent bikes from stations with many bikes available rather than from stations with few bikes.
    When a customer returns a bike, there is 1 bike more in the station. 
    Thus, there now may are 'too many' bikes and we might have to increase the incentive to rent bikes from this station.
    To this end, we define the following thresholds for the respective incentive levels (none, low, medium and high):
    1) less than 60% of max capacity available --> incentive level "none"
    2) between 60% and 80% of max capacity available --> incentive level "low"
    3) between 80% and 90% of max capacity available --> incentive level "medium"
    4) between 90% and 100% of max capacity available --> incentive level "high"
     */

    // Define constants for the respective thresholds as just described
    const thresholdLowPercentage = 0.6
    const thresholdMediumPercentage = 0.8
    const thresholdHighPercentage = 0.9

    const thresholdLow = Math.floor(thresholdLowPercentage * station.maxCapacity)
    const thresholdMedium = Math.floor(thresholdMediumPercentage * station.maxCapacity)
    const thresholdHigh = Math.floor(thresholdHighPercentage * station.maxCapacity)
    console.log("thresholdLow:", thresholdLow)
    console.log("thresholdMedium:", thresholdMedium)
    console.log("thresholdHigh:", thresholdHigh)

    // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the stations
    const rentIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
    const rentIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
    const rentIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
    const rentIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

    // Default incentive level is "none". Adjust with the below if statements
    let rentIncentiveLevelID = rentIncentiveLevelNoneID
    let rentIncentiveLevelName = "none" // This variable is just for logging purposes

    if (station.bikesAvailable + 1 >= thresholdHigh) {
        rentIncentiveLevelID = rentIncentiveLevelHighID
        rentIncentiveLevelName = "high"
    } else if (station.bikesAvailable + 1 >= thresholdMedium) {
        rentIncentiveLevelID = rentIncentiveLevelMediumID
        rentIncentiveLevelName = "medium"
    } else if (station.bikesAvailable + 1 >= thresholdLow) {
        rentIncentiveLevelID = rentIncentiveLevelLowID
        rentIncentiveLevelName = "low"
    }

    console.log("rentIncentiveLevelName:", rentIncentiveLevelName)
    console.log("rentIncentiveLevelID:", rentIncentiveLevelID)

    // Update the incentive level in the database
    try {
        await UPDATE(Stations).set({ rentIncentiveLevel_ID: rentIncentiveLevelID }).where({ ID: station.ID })
        console.log(`Rent incentive level updated for station ID: ${station.ID}`)
    } catch (error) {
        console.error("Error updating rent incentive level in the database:", error)
    }
}


async function updateBikeIncentiveLevels(station, Bikes) {
    /*
    Overview of the incentive logic on bike level:
    In the above code, every station got assigned a return incentive level and a rent incentive level to achieve a even distribution of bikes among stations.
    Now, our next goal is to achieve an even utilization of the bikes in the station to reduce overall maintenance costs.
    Thus, we want to incentivize customers to rent bikes with few kilometers instead of bikes with many kilometers.
    To achieve this, we assign each bike an incentive level.
    The idea is to sort all bikes in the given station by total kilometers driven and partition them into 4 (roughly) equally sized groups.
    The 25% of bikes with the most kilometers get the incentive level "none".
    The next 25% of bikes get the incentive level "low".
    The next 25% of bikes get the incentive level "medium".
    The 25% of bikes with the least kilometers get the incentive level "high".
     */

    // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the bikes
    const bikeIncentiveLevelNoneID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
    const bikeIncentiveLevelLowID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
    const bikeIncentiveLevelMediumID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
    const bikeIncentiveLevelHighID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

    // Find all bikes at the station where the customer returned the bike.
    // Note that we explicitely do not filter the status of the bike
    const bikesInStation = await SELECT.from(Bikes).where({ currentStation_ID: station.ID })
    console.log("bikesInStation:", bikesInStation)

    // Sort the bikes by kilometers in descending order.
    const sortedBikes = bikesInStation.slice().sort((a, b) => b.kilometers - a.kilometers)
    console.log("sortedBikes:", sortedBikes)

    // Calculate the number of bikes in each partition. We partition the list of bikes into four parts (25% of bikes each) for the four incentive levels (none, low, medium and high).
    const partitionSize = Math.floor(sortedBikes.length / 4)
    console.log("partitionSize:", partitionSize)

    // Set incentive levels relatively based on kilometers as described above.
    console.log("Start looping through sortedBikes ...")
    for (let i = 0; i < sortedBikes.length; i++) {
        console.log("Start iteration number", i)
        let bikeIncentiveLevelID = bikeIncentiveLevelNoneID
        if (i < partitionSize) {
            bikeIncentiveLevelID = bikeIncentiveLevelNoneID
        } else if (i < partitionSize * 2) {
            bikeIncentiveLevelID = bikeIncentiveLevelLowID
        } else if (i < partitionSize * 3) {
            bikeIncentiveLevelID = bikeIncentiveLevelMediumID
        } else {
            bikeIncentiveLevelID = bikeIncentiveLevelHighID
        }
        console.log("Bike Nr", i, "has bikeIncentiveLevelID", bikeIncentiveLevelID, ".")

        // Update the incentive level for the bike in the database.
        try {
            await UPDATE(Bikes).set({ incentiveLevel_ID: bikeIncentiveLevelID }).where({ ID: sortedBikes[i].ID })
            console.log("Finished iteration number", i)
        } catch (error) {
            console.error("Error updating bike incentive level in database:", error)
        }
    }
    console.log("Finished incentive logic on bike level.")
}


module.exports = {
    updateReturnIncentiveLevel, updateRentIncentiveLevel, updateBikeIncentiveLevels
}