import { RhelenaPresentationModel } from 'rhelena';
import mqttProvider from 'simple-mqtt-client'
import manuh from 'manuh'
import status from './services/status'
import instructions from './services/instructions'
import topics from './services/topics'

const uuidv1 = require('uuid/v1');

export default class ChimpWidgetModel extends RhelenaPresentationModel {
    constructor(backendEndpoint, mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic) {
        super();

        this.session = null
        this.userData = global.userData
        this.keepAliveIntervalHandler = null
        this.keepAliveTTL = 0
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

        let sessionTopic = null
        let sessionId = null
        mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, mqttBaseTopic, async (mqttClient) => {

            // resolve sessionTopic
            if (window.localStorage.lastSessionInfo) {
                const sessionInfo = JSON.parse(window.localStorage.lastSessionInfo)
                this.session = await fetch(`${backendEndpoint}/session/${sessionInfo.sessionId}`)                
                this.session = await this.session.json()
                sessionId = sessionInfo.sessionId
            }
            
            if (!this.session) { //if the session was not found or didn't existed
                delete window.localStorage.lastSessionInfo
                let sessionConfig = await fetch(`${backendEndpoint}/session`, { method: "POST" })
                sessionConfig = await sessionConfig.json()
                sessionId = sessionConfig.sessionId
                sessionTopic = `${topics.server.sessions._path}/${this.userData.id}/${sessionId}`
                this.keepAliveTTL = sessionConfig.keepAliveTTL
                
            }else{ //if the session is still active, retrieve to resume it
                sessionTopic = this.session.sessionTopic
                manuh.publish(topics.sessions.updates, this.session) //update locally
            } 
            
            mqttClient.subscribe(`${sessionTopic}/client/control`, msg => {
                
                if (msg.instruction === instructions.session.ready) {
                    this.session = msg.sessionInfo
                    window.localStorage.lastSessionInfo = JSON.stringify(this.session)
                    
                    if (this.keepAliveIntervalHandler) {
                        clearInterval(this.keepAliveIntervalHandler)
                    }

                    // first keepAlive
                    this.session.status = status.session.online
                    mqttClient.publish(topics.server.sessions.online, this.session)                    

                    // Schedule keep alives
                    console.log('===>>>',this.keepAliveTTL);
                    
                    this.keepAliveIntervalHandler = setInterval(() => {
                        this.session.status = status.session.online
                        mqttClient.publish(topics.server.sessions.online, this.session)
                    }, this.keepAliveTTL/2)
                    
                    manuh.publish(topics.sessions.updates, msg.sessionInfo)
                }else if (msg.instruction === instructions.session.aborted.expired) {
                    delete window.localStorage.lastSessionInfo
                    if (this.keepAliveIntervalHandler) {
                        clearInterval(this.keepAliveIntervalHandler)
                    }
                }
            }, "ChimpWidgetModel")

            mqttClient.subscribe(`${sessionTopic}/messages`, msg => {
                manuh.publish(topics.sessions.updates, msg)
            })

            
            
            // send start session event
            mqttClient.publish(topics.server.sessions.online, 
                {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "lastMessages": [],
                    "customer": this.userData,
                    "requestID": uuidv1(),
                    "keepAliveTTL": this.keepAliveTTL
                })

        })
    }
}