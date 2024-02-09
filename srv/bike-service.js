/* Remark for the course instructors:
This file contains exhaustive console logs to make it easier for the instructors to track what is going on in case something is unclear.
The project team is aware that this is not a best practice in production code.
When an event has ocurred, the cloud foundry logs can be read by running the following commands
in the terminal of the Business Application Studio:

cf login --sso -a https://api.cf.eu20.hana.ondemand.com
--> login to Cloud Foundry with this command (only needed once)

cf logs ibike-srv --recent
--> display recent logs in the terminal

rerun the latter command whenever an event has occured to see the latest logs.
*/

const cds = require("@sap/cds")
const config = require('./config.json')
const { updateRentIncentiveLevel, updateReturnIncentiveLevel, updateBikeIncentiveLevels } = require('./incentive-functions.js')
const { redistributeBikes } = require('./redistribution.js')

class BikeService extends cds.ApplicationService {
  async init() {
    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities

    const messaging = await cds.connect.to("messaging")

    // Event: A customer rents a bike from a station
    messaging.on("TUM/ibike/em/bikes/rented", async (event) => {
      console.log("*** Start of bike rental event handling ***")

      console.log("event:", event)

      const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeID })
      console.log("bike:", bike)

      const station = await SELECT.one.from(Stations).where({ ID: event.data.stationID })
      console.log("station:", station)

      if (bike && station) {
        // Set status to "rented" and decrease bikesAvailable in this station by 1
        await UPDATE(Bikes).set({ status: "rented" }).where({ ID: bike.ID })
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable - 1").where({ ID: station.ID })

        // Create a const for the new number of bikes available to simplify the below condition
        const bikesAvailable = station.bikesAvailable - 1

        // Redistribution is triggered when there are either <= 5 bikes in the station or <= 20% of the station's max capacity (values defined in configfile)
        let thresholdMet = bikesAvailable <= config.redistrThresholdAbs || bikesAvailable <= station.maxCapacity * config.redistrThresholdRel

        // Additionally, there should only be 1 active redistribution task at a time for this station
        if (thresholdMet && !(station.redistributionActive)) {
          console.log("Redistribution logic was triggered ...")
          await redistributeBikes(station.ID, Stations, Bikes, Workers, RedistributionTasks, TaskItems)
        } else {
          console.log("Redistribution logic was not triggered. The threshold was not met and/or there is already another active redistribution task for this station.")
        }

        // Update incentive to rent bikes from this station
        await updateRentIncentiveLevel(station.ID, Stations)

        // Update incentive to return bikes to this station
        await updateReturnIncentiveLevel(station.ID, Stations)

        // Update incentives on bike level (incentive to rent bikes with less kilometers)
        await updateBikeIncentiveLevels(station.ID, Bikes)

      } else {
        if (!bike) {
          console.log("No bike found with ID:", event.data.bikeID)
        }

        if (!station) {
          console.log("No station found with ID:", event.data.stationID)
        }

        console.log("Event cannot be handled as bike and/or station could not be found in the database.")
      }
      console.log("*** Bike rental event handling finished ***")
    })

    // Event: A Customer returns a bike to a station
    messaging.on("TUM/ibike/em/bikes/returned", async (event) => {
      console.log("*** Start of bike return event handling ***")

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
          .set({ status: "stationed", currentStation_ID: station.ID, kilometers: newTotalKilometers })
          .where({ ID: bike.ID })

        // Update bikes available
        await UPDATE(Stations).set("bikesAvailable = bikesAvailable + 1").where({ ID: station.ID })

        // Update incentive to rent bikes from this station
        await updateRentIncentiveLevel(station.ID, Stations)

        // Update incentive to return bikes to this station
        await updateReturnIncentiveLevel(station.ID, Stations)

        // Update incentives on bike level (incentive to rent bikes with less kilometers)
        await updateBikeIncentiveLevels(station.ID, Bikes)

      } else {
        if (!bike) {
          console.log("No bike found with ID:", event.data.bikeID)
        }

        if (!station) {
          console.log("No station found with ID:", event.data.stationID)
        }

        console.log("Event cannot be handled as bike and/or station could not be found in the database.")
      }
      console.log("*** Bike return event handling finished ***")
    })

    return super.init()
  }
}

module.exports = { BikeService }
