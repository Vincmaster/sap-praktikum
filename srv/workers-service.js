const cds = require('@sap/cds')
const { updateReturnIncentiveLevel, updateRentIncentiveLevel, updateBikeIncentiveLevels } = require('./incentive-functions.js')

class WorkersService extends cds.ApplicationService {
  init() {

    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities

    this.on('changeStatus', 'RedistributionTasks', async req => {
      console.log('A Worker has changed a task status in the Workers App')

      const task = await SELECT.one.from(RedistributionTasks).where({ ID: req.params[0] })

      // Get all task items (i.e. all bikes) that belong to this redistribution task
      const taskItems = await SELECT.from(TaskItems).where({ task_ID: req.params[0] })
      console.log("taskItems:", taskItems)

      if (task.status_code === "OPEN") {
        await UPDATE(RedistributionTasks).set({ status_code: "IN_PROGRESS" }).where({ ID: req.params[0] })

        // For every task item (i.e., bike), set the status to "redistributing"
        for (const taskItem of taskItems) {
          await UPDATE(Bikes).set({ status: "redistributing" }).where({ ID: taskItem.bike_ID })
        }
      } else if (task.status_code === "IN_PROGRESS") {
        await UPDATE(RedistributionTasks).set({ status_code: "DONE" }).where({ ID: req.params[0] })

        let targetID // helper variable to set redistributionActive flag below

        /* For every task item (i.e., bike), set the status to "stationed" such that it is available for customers to rent it
           and set the target station as its new station 
           and increase bikesAvailable of the corresponding station by 1. */
        for (const taskItem of taskItems) {
          await UPDATE(Bikes)
            .set({ status: "stationed", currentStation_ID: taskItem.target_ID })
            .where({ ID: taskItem.bike_ID })

          await UPDATE(Stations).set("bikesAvailable = bikesAvailable + 1").where({ ID: taskItem.target_ID })

          targetID = taskItem.target_ID
        }
        await UPDATE(Stations).set({ redistributionActive: false }).where({ ID: targetID })

        // Due to the redistribution task that has just been finished, bikesAvailable has changed in the target station. Thus, we need to update the 3 incentive levels there.
        const targetStation = await SELECT.one.from(Stations).where({ ID: targetID })
        
        // Update incentive to rent bikes from this station
        await updateRentIncentiveLevel(targetStation.ID, Stations)

        // Update incentive to return bikes to this station
        await updateReturnIncentiveLevel(targetStation.ID, Stations)

        // Update incentives on bike level (incentive to rent bikes with less kilometers)
        await updateBikeIncentiveLevels(targetStation.ID, Bikes)

      } else {
        console.log("Invalid task status.")
      }
    })
    return super.init()
  }
}
module.exports = WorkersService