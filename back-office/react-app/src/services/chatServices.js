import mqttProvider from 'simple-mqtt-client'
import manuh from 'manuh'

import status from '../status'
import topics from '../topics'
import config from '../config'
import instructions from './instructions'

import debugLib from 'debug'
const debug = debugLib('debug-chatServices')

// enable debug for browser, if running on it
if (window.localStorage && process.env.REACT_APP_DEBUG)  {
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
        
        const sessionControlSubscribe = (sessionTopic) => {
            // start listening for serssion instructions and notify that this attendant is available
            chatServices.mqttClient.subscribe(`${sessionTopic}/client/control`, async msg => {                
                if (msg.instruction === instructions.session.ready) {
                    debug("Session started. Details:", msg.sessionInfo)
    
                    // publish to the App components that this session is online
                    manuh.publish(topics.sessions.updates, msg.sessionInfo)
    
                }else if (msg.instruction === instructions.session.update) {
                    debug("Session update received. Details:", msg.sessionInfo)
    
                    // publish to the App components the session update
                    manuh.publish(topics.sessions.updates, msg.sessionInfo)
                
                }else if (msg.instruction === instructions.session.aborted.expired) {
                    debug("Session expired. Details:", msg.sessionInfo)
    
                    // publish to the App components that this session is offline
                    msg.sessionInfo.status = status.session.aborted
                    manuh.publish(topics.sessions.updates, msg.sessionInfo)
                }
            }, "sessionControlSubscribe")  
        }

        if (!chatServices._ready) {

            debug('Starting chatServices...')
            mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClientParam) => {    
                
                chatServices.mqttClient = mqttClientParam
                
                // subscribe to chat session attendant assignment requests 
                chatServices.mqttClient.subscribe(`${topics.client.attendants.assign}/${attendantInfo.id}`, (msg) => {
                    debug('Attendance request received. Details:', msg)
                    const attendantAssignment = {
                        attendantInfo: attendantInfo,
                        sessionInfo: msg
                    }
    
                    sessionControlSubscribe(msg.sessionTopic)

                    // respond the assignment positively
                    chatServices.mqttClient.publish(topics.server.attendants.assign, attendantAssignment)
                    debug('Attendant assignment response. Details:', attendantAssignment)
                })                
                
                // start the keep alive cycle to inform that this attendant is available
                const post = await fetch(`${config.backendEndpoint}/config/attendant`)
                const attendantConfig = await post.json()                   
                debug("Starting to send attendant KeepAlive. Interval: ", attendantConfig.keepAliveTTL/2)
                chatServices.mqttClient.publish(topics.server.attendants.online, {
                    attendantInfo: attendantInfo
                }) // send the first register
                chatServices.keepAliveIntervalHandler = setInterval(() => {
                    chatServices.mqttClient.publish(topics.server.attendants.online, {
                        attendantInfo: attendantInfo
                    })
                }, attendantConfig.keepAliveTTL/2)
                
                chatServices._ready = true

                // active sessions means: only the users that had chatted recently
                const activeSessions = await chatServices.getAttendantDistinctSessions(attendantInfo.id)
                
                for(let count=0; count < activeSessions.length; count++) {
                    const session = activeSessions[count]
                    // retrieve the last sessions messages for the same user if the last session has few messages
                    if (session.lastMessages.length < 50) {
                        session.lastMessages = await chatServices.getCustomerLastMessages(session.customer.id)
                    }
                    sessionControlSubscribe(session.sessionTopic)
                }
                
                onServiceStarted(activeSessions)
            });
            
        }else{
            const activeSessions = await chatServices.getAttendantSessions(attendantInfo.id)
            activeSessions.forEach(session => sessionControlSubscribe(session.sessionTopic))
            onServiceStarted(activeSessions)
        }                
    },

    async connectToChatSession(sessionInfo, source, onConnect, onMessageReceived) {
        // associate this source to this chat session
        this.mqttClient.unsubscribe(`${sessionInfo.sessionTopic}/messages`, source)
        this.mqttClient.subscribe(`${sessionInfo.sessionTopic}/messages`, onMessageReceived, source)
        if (onConnect) {
            const lastCustomerMessages = await chatServices.getCustomerLastMessages(sessionInfo.customer.id)
            sessionInfo.lastMessages = lastCustomerMessages
            onConnect(sessionInfo)
        }
    },

    //update customer to all those listening to changes on it
    sendMessage(session, message) {
        //send just the last 5 messages
        let clonedSession = JSON.parse(JSON.stringify(session))
        clonedSession.lastMessages.push(message)
        const startIndex = 0
        clonedSession.lastMessages = clonedSession.lastMessages.slice(startIndex, clonedSession.lastMessages.length)
        this.mqttClient.publish(`${session.sessionTopic}/messages`, {
            sessionInfo: clonedSession,
            message: message
        }) //session with updated message list
    },

    async getAttendantDistinctSessions(attendantId) {
        const req = await fetch(`${config.backendEndpoint}/attendant/${attendantId}/sessions`)
        const sessions = await req.json()

        return sessions
    },

    async getCustomerLastMessages(customerId) {
        const req = await fetch(`${config.backendEndpoint}/customer/${customerId}/messages?limit=50`)
        const messages = await req.json()        
        return messages.map(m => m.message)
    }
}


export default chatServices