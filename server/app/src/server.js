const logger = require('console-server')
const express = require('express')
const cors = require('cors')
const mqttProvider = require('simple-mqtt-client')
const sessionCoordinator = require('./session-coordinator')
const sessionRepo = require('./session-repo')
const attendantScheduler = require('./attendant-scheduler')
const chatLogger = require('./chat-logger')

const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"

logger.info(`MQTT Provider params: 
MQTT_BROKER_HOST=${process.env.MQTT_BROKER_HOST} 
MQTT_USERNAME=${process.env.MQTT_USERNAME} 
MQTT_PASSWORD=${process.env.MQTT_PASSWORD}
MQTT_BASE_TOPIC=${mqttBaseTopic}`)

//init mqttProvider so all the components can connect to mqttBroker
mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, mqttClient => {
    
    // start session coordinator
    sessionCoordinator.start(mqttClient, () => {
        logger.info("Session coordinator started.")
    })

    //start attendant scheduler
    attendantScheduler.start(mqttClient, () => {
        logger.info("Attendant scheduler started.")
    })

    //start chat logger
    chatLogger.start(mqttClient, () => {
        logger.info("Chat logger started.")
    })

})


// bring up the API server 
const app = express()
app.use(cors())
const port = 3000

app.get('/session/:id', (req, res) => {
    let resp = sessionRepo.getSession(req.params.id)
    res.json(resp)
})


app.get('/session/:sessionId/messages', (req, res) => {    
    chatLogger.getSessionMessages(req.params.sessionId, req.query.offset ? req.query.offset : 0, req.query.limit ? req.query.limit : 20, (messages) => {
        if(!messages) {
            return res.status(500).send("Error retrieving message")
        }
        messages = messages.map(message => {
            message.sessionInfo.lastMessages = []
            return message
        })
        return res.json(messages)
    })
})

app.post('/session', (req, res) => {
    res.json({ 
        sessionId: sessionCoordinator.generateSessionID(),
        keepAliveTTL: sessionRepo.sessionKeepAliveTime
    })
})

app.get('/attendant/:attendantId/sessions', (req, res) => {
    attendantScheduler.getSessionsByAttendant(req.params.attendantId, req.query.offset ? req.query.offset : 0, req.query.limit ? req.query.limit : 50, (sessions, err) => {
        if (err) {
            console.error(err)
            return res.status(500).send("Error retrieving attendant sessions")
        }
        res.json(sessions)
    })
})

app.get('/config/attendant', (req, res) => {
    res.json({
        keepAliveTTL: attendantScheduler.attendantKeepAliveTime
    })
})


app.get('/customer/:customerId/sessions/last', (req, res) => {
    sessionRepo.getSessionsByCustomer(req.params.customerId, 0, 10, (sessions, err) => {
        if (err) {
            console.error(err)
            return res.status(500).send("Error retrieving attendant sessions")
        }
        res.json(sessions)
    })
})

app.get('/customer/:customerId/messages', (req, res) => {
    chatLogger.getCustomerMessages(req.params.customerId, req.query.offset ? req.query.offset : 0, req.query.limit ? req.query.limit : 50, (messages, err) => {
        if(!messages || err) {
            return res.status(500).send("Error retrieving message")
        }
        messages = messages.map(message => {
            delete message._id
            delete message.sessionInfo.sessionTemplate
            message.sessionInfo.lastMessages = []
            return message
        })
        return res.json(messages)
    })
})

app.listen(port, () => console.log(`Chimp Assist API running on ${port}!`))
