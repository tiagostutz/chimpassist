import { RhelenaPresentationModel, globalState } from 'rhelena';
import mqttProvider from 'simple-mqtt-client'
import manuh from 'manuh'

import instructions from './services/instructions'
import topics from './services/topics'
import status from './services/status'

import i18n from "i18next";
// import 'moment/locale/pt-br';
// i18n.changeLanguage("ptBR")

const uuidv1 = require('uuid/v1');

export default class ChimpWidgetModel extends RhelenaPresentationModel {
    constructor({backendEndpoint, mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic}) {
        super();

        this.keepAliveIntervalHandler = null
        this.keepAliveTTL = 0
        this.retryHandler = null
        globalState.mqttClient = null
        
        globalState.backendEndpoint = backendEndpoint

        if (!globalState.userData ) {
            if (window.localStorage.userData) {
                globalState.userData = JSON.parse(window.localStorage.userData)
            }else{
                globalState.userData = {
                    "name": "Guest " +  Math.floor(100000 * Math.random()),
                    "id": uuidv1(),
                    "avatarURL": "https://camo.githubusercontent.com/0742cd827f51572237a28b94922e84b5294f98e2/68747470733a2f2f7265732e636c6f7564696e6172792e636f6d2f737475747a736f6c75636f65732f696d6167652f75706c6f61642f635f63726f702c685f3330382f76313533393930363537362f6e6f756e5f436162696e5f4d6f6e6b65795f3737343332385f7978696463722e706e67"
                }
                window.localStorage.userData = JSON.stringify(globalState.userData)
            }
        }
        this.userData = globalState.userData

        mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClient) => {
            globalState.mqttClient = mqttClient
            this.startSession()
        })
    }

    async startSession() {

        if (this.keepAliveIntervalHandler) {
            clearInterval(this.keepAliveIntervalHandler)
        }

        // resolve last session
        const sessionReq = await fetch(`${globalState.backendEndpoint}/customer/${globalState.userData.id}/sessions/last`)                            
        const arrSessions = await sessionReq.json()
        
        if (arrSessions.length > 0) {
            globalState.session = arrSessions[0]
            globalState.session.status = status.session.online
            const req = await fetch(`${globalState.backendEndpoint}/customer/${globalState.userData.id}/messages?limit=50`)
            const messages = await req.json()        
            globalState.session.lastMessages = messages.map(m => m.message)
        }

        let sessionTopic = null
        if (!globalState.session) { //if the session was not found or didn't existed

            //Create a NEW Session - get server params
            const req = await fetch(`${globalState.backendEndpoint}/session`, { method: "POST" })

            // if there were a problem fetching session setup config
            if (req.status !== 200) {
                this.retryHandler = setInterval(() => {
                    this.startSession()
                }, 10000)
                return console.error("Could not retrieve sessionConfig from server. Aborting and retrying.")                
            }            

            // go on and config the session request
            const sessionConfig = await req.json()
            sessionTopic = `${topics.server.sessions._path}/${globalState.userData.id}`
            this.keepAliveTTL = sessionConfig.keepAliveTTL

            // send start new session event
            globalState.mqttClient.publish(topics.server.sessions.online, 
            {
                "sessionTopic": sessionTopic,
                "sessionId": sessionConfig.sessionId,
                "lastMessages": [],
                "customer": globalState.userData,
                "requestID": uuidv1(),
                "keepAliveTTL": this.keepAliveTTL
            })

            //schedule retry handler if there's no attendant now, but can be avaliable in a interval
            this.retryHandler = setInterval(() => {
                this.startSession()
            }, 10000)
            
        }else{ //if the session is still active, retrieve to resume it
            sessionTopic = globalState.session.sessionTopic
            this.keepAliveTTL = globalState.session.keepAliveTTL            
            if (this.retryHandler) {
                clearInterval(this.retryHandler)
            }
            this.startKeepAliveCron()
            manuh.publish(topics.sessions.updates, globalState.session) //update locally
        } 
        
        // receive commands and updates from session (not included messages)
        globalState.mqttClient.subscribe(`${sessionTopic}/client/control`, async msg => {                            
            
            // check whether is just a keep-alive or there are actual changes to the session, like the new session accepted
            if ( !globalState.session || globalState.session.sessionId !== msg.sessionInfo.sessionId) {
                globalState.session = msg.sessionInfo
                const req = await fetch(`${globalState.backendEndpoint}/customer/${globalState.userData.id}/messages?limit=50`)
                const messages = await req.json()        
                globalState.session.lastMessages = messages.map(m => m.message)
                manuh.publish(topics.sessions.updates, globalState.session)
            }

            if (msg.instruction === instructions.session.ready) { //when the session is ready, send a final message telling that the communication is "online"
                if (this.retryHandler) {
                    clearInterval(this.retryHandler)
                }

                this.startKeepAliveCron()
                
            }else if (msg.instruction === instructions.session.aborted.expired) {
                this.startSession()                
            }

        }, "ChimpWidgetModel")

        globalState.mqttClient.subscribe(`${sessionTopic}/messages`, payload => {
            const sessionWithMessages = payload.sessionInfo
            globalState.session = sessionWithMessages
            manuh.publish(`${sessionTopic}/messages`, payload)

        }, "ChimpWidgetModel")  
        
        manuh.subscribe(topics.chatStation.messagePane.send, "ChimpWidgetModel", msg => {
            this.sendMessage(msg.messageContent)
        })
        
    }

    sendMessage(messageContent) {
        const message = {
            "from" : globalState.userData, 
            "timestamp" : new Date().getTime(), 
            "content" : messageContent,
            "readAt": null
        }

        let clonedSession = JSON.parse(JSON.stringify(globalState.session))
        clonedSession.lastMessages.push(message)
        const startIndex = 0
        clonedSession.lastMessages = clonedSession.lastMessages.slice(startIndex, clonedSession.lastMessages.length)
        globalState.mqttClient.publish(`${globalState.session.sessionTopic}/messages`, {
            sessionInfo: clonedSession,
            message: message
        })

    }

    startKeepAliveCron() {

        // immediately send a keepAlive
        globalState.mqttClient.publish(topics.server.sessions.online, globalState.session)                    
        
        // Schedule keep alives
        if (this.keepAliveIntervalHandler) {
            clearInterval(this.keepAliveIntervalHandler)
        }
        const refreshInterval = this.keepAliveTTL>10000 ? 10000 : this.keepAliveTTL/2
        this.keepAliveIntervalHandler = setInterval(() => {
            globalState.mqttClient.publish(topics.server.sessions.online, globalState.session)
        }, refreshInterval)
    }
}