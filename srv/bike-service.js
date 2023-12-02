const cds = require('@sap/cds')
const log = cds.log('ibike')

class BikeService extends cds.ApplicationService {

    async init() {
        const { Bikes } = this.entities

        const messaging = await cds.connect.to('messaging')

        messaging.on('TUM/ibike/em/bikes/rented', async (event) => {
            log.info('on bikeRented data:', event.data, 'headers:', event.headers)
            const bike = await SELECT.one.from(Bikes).where({ ID: event.data.bikeId })
        })

        messaging.on('TUM/ibike/em/bikes/returned', async (event) => {
            log.info('on bikeReturned data:', event.data, 'headers:', event.headers)
        })

        return super.init()
    }

}

module.exports = { BikeService }