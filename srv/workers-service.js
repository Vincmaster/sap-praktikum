// worker-service.js
const cds = require('@sap/cds');

console.log("worker-service.js wird hineingegangen")

class WorkersService extends cds.ApplicationService {
  init() {

    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities;

    this.on('changeStatus', 'RedistributionTasks', async req => {
      console.log('changeStatus event triggered');
      console.log('Request parameters:', req.params);
  
      const result= await UPDATE(RedistributionTasks)
      .set({ status_code: 'DONE' }) // Adjust this based on your TaskStatus definition
      .where({ ID: req.params[0] }); // Assuming ID is the key field, adjust as needed
      console.log('TaskStatus updated successfully');
    })
    return super.init()
  }
}
module.exports = WorkersService