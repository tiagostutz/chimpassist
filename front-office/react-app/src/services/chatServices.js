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

let chatServices = {
    _ready: false,
    mqttClient: null,
    startChat: async (customerId, onChatReady, onChatAborted) => {

        const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"
        const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
        const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
        const baseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC
        
        mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, baseTopic, (mqttClientParam) => {    
            chatServices._ready = true
            chatServices.mqttClient = mqttClientParam

            const sessionIdFetch = await fetch(`${config.backendEndpoint}/session`, { method: "POST" })
            let sessionId = await sessionIdFetch.json()
            const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
            
            chatServices.mqttClient.subscribe(`${sessionTopic}/client/control`, (msg) => {
    
                if (msg.instruction === instructions.session.ready) {
                    onChatReady(msg.sessionInfo)
                    
                }else if (msg.instruction === instructions.session.aborted.unavailableAttendants) {
                    onChatAborted(msg.sessionInfo)
                }
    
            })
            
            chatServices.mqttClient.publish(topics.server.sessions.request, {
                "sessionTopic": sessionTopic,
                "sessionId": sessionId,
                "customerId": customerId,
                "requestID": uuidv1(),
            })            
        });

    }
}

export default chatServices