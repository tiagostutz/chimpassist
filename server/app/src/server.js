const logger = require('console-server')
const express = require('express')
const cors = require('cors')
const sessionCoordinator = require('./session-coordinator')
const attendantScheduler = require('./attendant-scheduler')

sessionCoordinator.start(() => {
    logger.info("Session coordinator started.")

    //start attendant scheduler
    attendantScheduler.start(() => {
        logger.info("Attendant scheduler started.")

        // bring up the API server 
        const app = express()
        app.use(cors())
        const port = 3000

        app.get('/session/:id', (req, res) => {
            let resp = sessionCoordinator.getSession(req.params.id)
            res.json(resp)
        })

        app.post('/session', (req, res) => {
            res.json({ 
                sessionId: sessionCoordinator.generateSessionID(),
                keepAliveTTL: sessionCoordinator.sessionKeepAliveTime
            })
        })

        app.get('/attendant/:id/sessions', (req, res) => {
            let resp = attendantScheduler.getSessionsByAttendant(req.params.id)
            res.json(resp)
        })

        app.get('/config/attendant', (req, res) => {
            res.json({
                keepAliveTTL: attendantScheduler.attendantKeepAliveTime
            })
        })
        
        app.listen(port, () => console.log(`Chimp Assist API running on ${port}!`))
    })
})
