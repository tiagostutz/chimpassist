import { RhelenaPresentationModel, globalState } from 'rhelena';
import mqttProvider from 'simple-mqtt-client'
import manuh from 'manuh'

import instructions from './services/instructions'
import topics from './services/topics'

const uuidv1 = require('uuid/v1');

export default class ChimpWidgetModel extends RhelenaPresentationModel {
    constructor(backendEndpoint, mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic) {
        super();

        this.userData = global.userData
        this.keepAliveIntervalHandler = null
        this.keepAliveTTL = 0
        this.mqttClient = null
        this.backendEndpoint = backendEndpoint
        this.retryHandler = null

        if (!this.userData && window.localStorage.userData) {
            this.userData = JSON.parse(window.localStorage.userData)
        }else{
            this.userData = {
                "name": "Guest",
                "id": uuidv1(),
                "avatarURL": "https://camo.githubusercontent.com/0742cd827f51572237a28b94922e84b5294f98e2/68747470733a2f2f7265732e636c6f7564696e6172792e636f6d2f737475747a736f6c75636f65732f696d6167652f75706c6f61642f635f63726f702c685f3330382f76313533393930363537362f6e6f756e5f436162696e5f4d6f6e6b65795f3737343332385f7978696463722e706e67"
            }
            window.localStorage.userData = JSON.stringify(this.userData)
        }

        mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClient) => {
            this.mqttClient = mqttClient
            this.startSession()
        })
    }

    async startSession() {

        let sessionTopic = null
        let sessionId = null

        if (this.keepAliveIntervalHandler) {
            clearInterval(this.keepAliveIntervalHandler)
        }

        // resolve sessionTopic
        if (window.localStorage.lastSessionInfo) {
            const sessionInfo = JSON.parse(window.localStorage.lastSessionInfo)
            const sessionReq = await fetch(`${this.backendEndpoint}/session/${sessionInfo.sessionId}`)                            
            globalState.session = await sessionReq.json()
            sessionId = sessionInfo.sessionId
        }
        
        if (!globalState.session) { //if the session was not found or didn't existed
            delete window.localStorage.lastSessionInfo
            let req = await fetch(`${this.backendEndpoint}/session`, { method: "POST" })
            if (req.status !== 200) {
                this.retryHandler = setInterval(() => {
                    this.startSession()
                }, 10000)
                return console.error("Could not retrieve sessionConfig from server. Aborting and retrying.")                
            }            
            let sessionConfig = await req.json()
            sessionId = sessionConfig.sessionId
            sessionTopic = `${topics.server.sessions._path}/${this.userData.id}/${sessionId}`
            this.keepAliveTTL = sessionConfig.keepAliveTTL

            // send start new session event
            this.mqttClient.publish(topics.server.sessions.online, 
            {
                "sessionTopic": sessionTopic,
                "sessionId": sessionId,
                "lastMessages": [],
                "customer": this.userData,
                "requestID": uuidv1(),
                "keepAliveTTL": this.keepAliveTTL
            })

            if (this.retryHandler) {
                clearInterval(this.retryHandler)
            }
            
        }else{ //if the session is still active, retrieve to resume it
            sessionTopic = globalState.session.sessionTopic
            this.keepAliveTTL = globalState.session.keepAliveTTL
            this.startKeepAliveCron()
            manuh.publish(topics.sessions.updates, globalState.session) //update locally
        } 
        
        // receive commands and updates from session (not included messages)
        this.mqttClient.subscribe(`${sessionTopic}/client/control`, msg => {                            
            
            if ( !globalState.session || (JSON.stringify(globalState.session) !== JSON.stringify(msg.sessionInfo)) ) { //online update when there is effectively changes
                globalState.session = msg.sessionInfo
                window.localStorage.lastSessionInfo = JSON.stringify(globalState.session) //update persistent session
                manuh.publish(topics.sessions.updates, globalState.session)
            }

            if (msg.instruction === instructions.session.ready) { //when the session is ready, send a final message telling that the communication is "online"
                this.startKeepAliveCron()
                
            }else if (msg.instruction === instructions.session.aborted.expired) {
                this.startSession()                
            }

        }, "ChimpWidgetModel")

        this.mqttClient.subscribe(`${sessionTopic}/messages`, payload => {
            const sessionWithMessages = payload.sessionInfo
            globalState.session = sessionWithMessages
            manuh.publish(`${sessionTopic}/messages`, payload)

        }, "ChimpWidgetModel")        
        
    }

    startKeepAliveCron() {

        // immediately send a keepAlive
        this.mqttClient.publish(topics.server.sessions.online, globalState.session)                    
        
        // Schedule keep alives
        if (this.keepAliveIntervalHandler) {
            clearInterval(this.keepAliveIntervalHandler)
        }
        const refreshInterval = this.keepAliveTTL>15000 ? 15000 : this.keepAliveTTL/2
        this.keepAliveIntervalHandler = setInterval(() => {
            this.mqttClient.publish(topics.server.sessions.online, globalState.session)
        }, refreshInterval)
    }
}