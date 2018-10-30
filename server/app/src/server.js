const logger = require('console-server')
const express = require('express')
const cors = require('cors')
const mqttProvider = require('simple-mqtt-client')
const sessionCoordinator = require('./session-coordinator')
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
