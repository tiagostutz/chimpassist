import mqttProvider from 'simple-mqtt-client'
import manuh from 'manuh'
import topics from '../topics'
import config from '../config'
import instructions from './instructions'

import debugLib from 'debug'
const debug = debugLib('debug-chatServices')

// enable debug for browser, if running on it
if (window.localStorage)  {
    window.localStorage.debug = process.env.REACT_APP_DEBUG
    console.log('window.localStorage.debug', window.localStorage.debug);
    
} 

let chatServices = {
    _ready: false,
    keepAliveIntervalHandler: null,
    mqttClient: null,
    startService: async (attendantInfo, onServiceStarted) => {
        const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"
        const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
        const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
        const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"
        
        if (!chatServices._ready) {

            debug('Starting chatServices...')
            mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClientParam) => {    
                
                chatServices._ready = true
                chatServices.mqttClient = mqttClientParam
                
                // subscribe to chat session attendant assignment requests 
                chatServices.mqttClient.subscribe(`${topics.client.attendants.assign}/${attendantInfo.id}`, (msg) => {
                    debug('Attendance request received. Details:', msg)
                    const attendantAssignment = {
                        attendantInfo: attendantInfo,
                        sessionInfo: msg
                    }
    
                    // start listening for serssion instructions and notify that this attendant is available
                    chatServices.mqttClient.subscribe(`${msg.sessionTopic}/client/control`, (msg) => {
                        if (msg.instruction === instructions.session.ready) {
                            debug("Session started. Details:", msg.sessionInfo)

                            // publish to the App components that this session is online
                            manuh.publish(topics.customer.sessions.updates, msg.sessionInfo.customer)
                        }
                    })

                    // respond the assignment positively
                    chatServices.mqttClient.publish(topics.server.attendants.assign, attendantAssignment)
                    debug('Attendant assignment response. Details:', attendantAssignment)
                })                
                
                // start the keep alive cycle to inform that this attendant is available
                const post = await fetch(`${config.backendEndpoint}/config/attendant`)
                const attendantConfig = await post.json()                   
                debug("Starting to send attendant KeepAlive. Interval: ", attendantConfig.keepAliveTTL/2)
                chatServices.keepAliveIntervalHandler = setInterval(() => {
                    chatServices.mqttClient.publish(topics.server.attendants.online, {
                        attendantInfo: attendantInfo
                    })
                }, attendantConfig.keepAliveTTL/2)
        
            });
            
        }
        onServiceStarted()                
    }
}


export default chatServices