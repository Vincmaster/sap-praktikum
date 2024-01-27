// worker-service.js
const cds = require('@sap/cds');

console.log("worker-service.js wird hineingegangen") // TODO rausnehmen

class WorkersService extends cds.ApplicationService {
  init() {

    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities;

    //Aktion für changeStatus (Setze status_code auf 'DONE')
    this.on('changeStatus', 'RedistributionTasks', async req => {
      console.log('changeStatus event triggered');
      console.log('Request parameters:', req.params);

      // Case 2: Set status from IN_PROGRESS to DONE
      const result2 = await UPDATE(RedistributionTasks)
        .set({ status_code: 'DONE' })
        .where({ ID: req.params[0] })
        .and({ status_code: "IN_PROGRESS" });
      console.log('TaskStatus updated successfully to DONE');

      // Case 1: Set status from OPEN TO IN_PROGRESS
      const result = await UPDATE(RedistributionTasks)
        .set({ status_code: 'IN_PROGRESS' })
        .where({ ID: req.params[0] })
        .and({ status_code: "OPEN" });
      console.log('TaskStatus updated successfully to IN_PROGRESS');




    })
    return super.init()
  }
}
module.exports = WorkersService