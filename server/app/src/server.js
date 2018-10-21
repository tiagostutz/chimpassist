const sessionCoordinator = require('./session-coordinator')
const attendantScheduler = require('./attendant-scheduler')
const logger = require('console-server')

sessionCoordinator.start(() => {
    logger.info("Session coordinator started.")

    //start attendant scheduler
    attendantScheduler.start(() => {
        logger.info("Attendant scheduler started.")
    })
})
