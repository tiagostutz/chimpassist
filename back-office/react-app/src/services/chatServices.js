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

manuh.subscribe(topics.chatStation.user.logout, "chatServices", _ => { 
    chatServices._ready = false
    window.location.href = window.location.href
})

let chatServices = {
    _ready: false,
    keepAliveIntervalHandler: null,
    mqttClient: null,
    startService: async (attendantInfo, onServiceStarted, onError) => {

        if (!attendantInfo) {
            debug("User not logged. Skipping ChatStation initialization...")
            return onError({ msg: "User not logged. Skipping ChatStation initialization..."})
        }

        const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8080/mqtt"
        const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
        const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
        const mqttBaseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC || "chimpassist/demo"
        
        const sessionControlSubscribe = (sessionTopic) => {
            // start listening for serssion instructions and notify that this attendant is available
            chatServices.mqttClient.subscribe(`${sessionTopic}/client/control`, async msg => {                
                if (msg.instruction === instructions.session.ready) {
                    debug("Session started. Details:", msg.sessionInfo)
                    
                }else if (msg.instruction === instructions.session.update) {
                    debug("Session update received. Details:", msg.sessionInfo)
                    
                }else if (msg.instruction === instructions.session.aborted.expired) {
                    debug("Session expired. Details:", msg.sessionInfo)
                    
                    // publish to the App components that this session is offline
                    msg.sessionInfo.status = status.session.aborted
                }
                // publish the session update to everyone
                manuh.publish(topics.sessions.updates, msg.sessionInfo)
                // publish the session update to the components attached to it
                manuh.publish(`${msg.sessionInfo.sessionTopic}/updates`, { session: msg.sessionInfo })
            }, "sessionControlSubscribe")
            
        }

        if (!chatServices._ready) {

            debug('Starting chatServices...')
            
            mqttProvider.new().init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClientParam) => {    
                
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
                
                // subscribe to remote commands
                chatServices.mqttClient.subscribe(`${topics.client.attendants.control}/${attendantInfo.id}`, (msg) => {
                    if (msg.instruction === instructions.attendant.control.terminate.activity_monitor_offline) {
                        manuh.publish(topics.chatStation.user.block, { info: "Você não está com o monitor de atividades ligado. Para continuar atendento por favor inicie-o na sua estação de trabalho. Suas sessões estão salvas e serão retomadas assim que o monitor de atividades estiver online."})
                    }else if (msg.instruction === instructions.attendant.control.resume.activity_monitor_online) {
                        console.log('========>>>>>>> RESUME', msg.instruction)                        
                        manuh.publish(topics.chatStation.user.unblock, { info: "Monitor de atividades ligado. Retomando sessões de atendimento."})
                    }
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
                
                debug("Active sessions sessions fetched:", activeSessions.length)
                for(let count=0; count < activeSessions.length; count++) {
                    const session = activeSessions[count]
                    // retrieve the last sessions messages for the same user if the last session has few messages
                    if (session.lastMessages.length < 50) {
                        session.lastMessages = await chatServices.getCustomerLastMessages(session.customer.id)
                    }
                    debug("Session", session.sessionTopic, "last messages count:", session.lastMessages.length)
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

    async connectToChatSession(sessionInfo, source, onConnect, onMessageReceived, onViewedMessageReceived) {
        // associate this source to this chat session
        this.mqttClient.unsubscribe(`${sessionInfo.sessionTopic}/messages`, source)
        this.mqttClient.subscribe(`${sessionInfo.sessionTopic}/messages`, onMessageReceived, source)
        if (onConnect) {
            const lastCustomerMessages = await chatServices.getCustomerLastMessages(sessionInfo.customer.id)
            sessionInfo.lastMessages = lastCustomerMessages
            onConnect(sessionInfo)
        }
        this.mqttClient.subscribe(`${sessionInfo.sessionTopic}/messages/viewed`, onViewedMessageReceived) //update messages viewed by the attendant            
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


    markAllMessagesAsRead(session, attendantInfo) {
        
        let unreadMessages = []
        
        session.lastMessages.forEach(m => {
            if (!m.readAt && m.from.id !== attendantInfo.id) {
                m.readAt = new Date().getTime()
                unreadMessages.push(m)
            }
        })
        if (unreadMessages.length > 0) {
            this.mqttClient.publish(`${session.sessionTopic}/messages/viewed`, { session: session, readMessages: unreadMessages})            
        }
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