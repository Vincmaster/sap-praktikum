// worker-service.js
const cds = require('@sap/cds');

console.log("worker-service.js wird hineingegangen")

class WorkersService extends cds.ApplicationService {
  init() {

    const { Bikes, Stations, Incentives, TaskItems, RedistributionTasks, TaskStatus, Workers } = this.entities;

    //Aktion für changeStatus (Setze status_code auf 'DONE')
    this.on('changeStatus', 'RedistributionTasks', async req => {
      console.log('changeStatus event triggered');
      console.log('Request parameters:', req.params);
  
      const result= await UPDATE(RedistributionTasks)
      .set({ status_code: 'DONE' }) 
      .where({ ID: req.params[0] }); 
      console.log('TaskStatus updated successfully');
    })

    //Aktion für startTask (Setze status_code auf 'IN_PROGRESS')
    this.on('startTask', 'RedistributionTasks', async req => {
      console.log('startTask event triggered');
      console.log('Request parameters:', req.params);
  
      const result= await UPDATE(RedistributionTasks)
      .set({ status_code: 'IN_PROGRESS' }) 
      .where({ ID: req.params[0] }); 
      console.log('TaskStatus updated successfully');
    })
    return super.init()
  }
}
module.exports = WorkersService