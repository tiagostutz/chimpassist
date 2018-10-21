import mqttProvider from 'simple-mqtt-client'
import uuidv1 from 'uuid/v1'
import topics from '../topics'
import config from '../config'
import instructions from './instructions'

// import { t } from 'i18next';
// import '../i18n.js'

// enable debug for browser, if running on it
if (window.localStorage)  {
    window.localStorage.debug = process.env.REACT_APP_DEBUG
} 

if (!process.env.REACT_APP_MQTT_BROKER_HOST) {
    console.error("REACT_APP_MQTT_BROKER_HOST not FOUND!")
    throw new Error("REACT_APP_MQTT_BROKER_HOST var is not set. Please provide a MQTT broker host to connect") 
}

const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"
const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
const baseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC


let chatServices = {
    _ready: false,
    mqttClient: null,
    startChat: async (customerId, onChatReady, onChatAborted) => {

        if (this.mqttClient==null) {
            throw new Error("Cannot start chat because there were problems with the MQTT client config")
        }

        const sessionIdFetch = await fetch(`${config.backendEndpoint}/session`, { method: "POST" })
        let sessionId = await sessionIdFetch.json()
        const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
        
        this.mqttClient.subscribe(`${sessionTopic}/client/control`, (msg) => {

            if (msg.instruction === instructions.session.ready) {
                onChatReady(msg.sessionInfo)
                
            }else if (msg.instruction === instructions.session.aborted.unavailableAttendants) {
                onChatAborted(msg.sessionInfo)
            }

        })
        
        this.mqttClient.publish(topics.server.sessions.request, {
            "sessionTopic": sessionTopic,
            "sessionId": sessionId,
            "customerId": customerId,
            "requestID": uuidv1(),
        })
    }
}

mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, baseTopic, (mqttClientParam) => {    
    chatServices._ready = true
    chatServices.mqttClient = mqttClientParam
});

export default chatServices