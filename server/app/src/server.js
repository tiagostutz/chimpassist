const logger = require('console-server')
const express = require('express')
const sessionCoordinator = require('./session-coordinator')
const attendantScheduler = require('./attendant-scheduler')

sessionCoordinator.start(() => {
    logger.info("Session coordinator started.")

    //start attendant scheduler
    attendantScheduler.start(() => {
        logger.info("Attendant scheduler started.")

        // bring up the API server 
        const app = express()
        const port = 3000

        app.post('/session', (req, res) => {
            res.json({ sessionId: sessionCoordinator.generateSessionID()})
        })

        app.listen(port, () => console.log(`Chimp Assist API running on ${port}!`))
    })
})
