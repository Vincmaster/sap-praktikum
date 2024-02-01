const config = require('./config.json')

async function updateRentIncentiveLevel(station, Stations) {
    console.log("*** Start of rent incentive logic (on station level) ***")
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
    These thresholds are defined in the configfile at the top level of the repository.
     */

    // Define constants for the respective thresholds as just described
    const thresholdLowPercentage = config.rentIncentiveThresholds.lowPercentage
    const thresholdMediumPercentage = config.rentIncentiveThresholds.mediumPercentage
    const thresholdHighPercentage = config.rentIncentiveThresholds.highPercentage

    const thresholdLow = Math.floor(thresholdLowPercentage * station.maxCapacity)
    const thresholdMedium = Math.floor(thresholdMediumPercentage * station.maxCapacity)
    const thresholdHigh = Math.floor(thresholdHighPercentage * station.maxCapacity)
    console.log("thresholdLow:", thresholdLow)
    console.log("thresholdMedium:", thresholdMedium)
    console.log("thresholdHigh:", thresholdHigh)

    // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the stations
    const rentIncentiveLevelNoneID = config.incentiveLevelIDs.none
    const rentIncentiveLevelLowID = config.incentiveLevelIDs.low
    const rentIncentiveLevelMediumID = config.incentiveLevelIDs.medium
    const rentIncentiveLevelHighID = config.incentiveLevelIDs.high

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

    console.log("*** End of rent incentive logic (on station level) ***")
}


async function updateReturnIncentiveLevel(station, Stations) {
    console.log("*** Start of return incentive logic (on station level) ***")
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
    These thresholds are defined in the configfile at the top level of the repository.
     */

    // Define constants for the respective thresholds as just described
    const thresholdLowPercentage = config.returnIncentiveThresholds.lowPercentage
    const thresholdMediumPercentage = config.returnIncentiveThresholds.mediumPercentage
    const thresholdHighPercentage = config.returnIncentiveThresholds.highPercentage

    const thresholdLow = Math.floor(thresholdLowPercentage * station.maxCapacity)
    const thresholdMedium = Math.floor(thresholdMediumPercentage * station.maxCapacity)
    const thresholdHigh = Math.floor(thresholdHighPercentage * station.maxCapacity)
    console.log("thresholdLow:", thresholdLow)
    console.log("thresholdMedium:", thresholdMedium)
    console.log("thresholdHigh:", thresholdHigh)

    // Define constants with the IDs (in hexadecimal HANA format) of the four possible incentive levels (none, low, medium and high) for the stations
    const returnIncentiveLevelNoneID = config.incentiveLevelIDs.none
    const returnIncentiveLevelLowID = config.incentiveLevelIDs.low
    const returnIncentiveLevelMediumID = config.incentiveLevelIDs.medium
    const returnIncentiveLevelHighID = config.incentiveLevelIDs.high

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

    console.log("*** End of return incentive logic (on station level) ***")
}


async function updateBikeIncentiveLevels(station, Bikes) {
    console.log("*** Start of incentive logic on bike level ***")

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
    const bikeIncentiveLevelNoneID = config.incentiveLevelIDs.none
    const bikeIncentiveLevelLowID = config.incentiveLevelIDs.low
    const bikeIncentiveLevelMediumID = config.incentiveLevelIDs.medium
    const bikeIncentiveLevelHighID = config.incentiveLevelIDs.high

    // Find all stationed bikes at the station where the customer returned the bike.
    // Note that we explicitely do not update the incentive levels for bikes which are rented or part of an ongoing redistribution task
    const bikesInStation = await SELECT.from(Bikes).where({ currentStation_ID: station.ID, status: "stationed" })
    console.log("bikesInStation:", bikesInStation)

    // Sort the bikes by kilometers in descending order
    const sortedBikes = bikesInStation.slice().sort((a, b) => b.kilometers - a.kilometers)
    console.log("sortedBikes:", sortedBikes)

    // Calculate the base size of each partition and the number of remaining elements
    const basePartitionSize = Math.floor(sortedBikes.length / 4)
    let remainingElements = sortedBikes.length % 4

    console.log("Start looping through partitions")
    let startIndex = 0
    for (let i = 0; i < 4; i++) {
        // Determine the size of this partition
        let partitionSize = basePartitionSize + (remainingElements > 0 ? 1 : 0)
        remainingElements--

        // Determine the incentive level ID based on the partition
        let bikeIncentiveLevelID
        switch (i) {
            case 0: bikeIncentiveLevelID = bikeIncentiveLevelNoneID; break;
            case 1: bikeIncentiveLevelID = bikeIncentiveLevelLowID; break;
            case 2: bikeIncentiveLevelID = bikeIncentiveLevelMediumID; break;
            case 3: bikeIncentiveLevelID = bikeIncentiveLevelHighID; break;
        }

        // Update the incentive level for the bikes in this partition
        for (let j = startIndex; j < startIndex + partitionSize; j++) {
            console.log("Bike Nr", j, "has bikeIncentiveLevelID", bikeIncentiveLevelID, ".")

            try {
                await UPDATE(Bikes).set({ incentiveLevel_ID: bikeIncentiveLevelID }).where({ ID: sortedBikes[j].ID })
                console.log("Finished updating bike", j)
            } catch (error) {
                console.error("Error updating bike incentive level in database:", error)
            }
        }

        // Update the start index for the next partition
        startIndex += partitionSize
    }
    console.log("*** End of incentive logic on bike level ***")
}

module.exports = {
    updateRentIncentiveLevel, updateReturnIncentiveLevel, updateBikeIncentiveLevels
}