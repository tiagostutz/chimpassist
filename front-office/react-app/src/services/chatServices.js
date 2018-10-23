import mqttProvider from 'simple-mqtt-client'
import uuidv1 from 'uuid/v1'
import topics from '../topics'
import config from '../config'
import status from '../status'
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
            let sessionConfig = await sessionIdFetch.json()
            const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionConfig.sessionId}`
            
            chatServices.mqttClient.subscribe(`${sessionTopic}/client/control`, (msg) => {
    
                if (msg.instruction === instructions.session.ready) {
                    debug("Session started. Details:", msg.sessionInfo)                    
                    // start the keep alive cycle to inform that this session is online
                    debug("Starting to send attendant KeepAlive. Interval: ", sessionConfig.keepAliveTTL/2)
                    chatServices.keepAliveIntervalHandler = setInterval(() => {
                        chatServices.mqttClient.publish(`${sessionTopic}/status`, { status: status.session.online })
                    }, sessionConfig.keepAliveTTL/2)
                    
                    onChatReady(msg.sessionInfo)

                }else if (msg.instruction === instructions.session.aborted.unavailableAttendants) {
                    onChatAborted(msg.sessionInfo)
                }
    
            })
            
            chatServices.mqttClient.publish(topics.server.sessions.online, {
                "sessionTopic": sessionTopic,
                "sessionConfig.sessionId": sessionConfig.sessionId,
                "customerId": customerId,
                "requestID": uuidv1(),
            })            
        });

    }
}

export default chatServices