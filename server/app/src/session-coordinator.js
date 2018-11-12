const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const manuh = require('manuh')

const topics = require('./lib/topics')
const status = require('./lib/status')
const attendantTypes = require('./lib/attendant-types')
const instructions = require('./lib/instructions')
const sessionRepo = require('./session-repo')
const attendatScheduler = require('./attendant-scheduler')


let lastSessionOnlineMessage = null
module.exports = {

    status: 0,
    mqttClient: null,    

    start: function(mqttClient, ready) {

        const _self = this
        if (_self.status < 2) {
            logger.info("Starting session-coordinator...")
            logger.info("Session Coordinator Keep Alive parameter: ", _self.sessionKeepAliveTime)
            _self.status = 1
            _self.mqttClient = mqttClient

            logger.debug("MQTT client details:", mqttClient)
                            
            sessionRepo.init()
            logger.info("Session database initialized")
        
            // listens for chat requests
            mqttClient.subscribe(topics.server.sessions.online, sessionInfoMsg => {
                                
                //prevent duplicate messages crash
                if (lastSessionOnlineMessage && sessionInfoMsg.customer.id === lastSessionOnlineMessage.content.customer.id && (new Date().getTime()-lastSessionOnlineMessage.timestamp)<1000) {
                    return;
                }
                
                lastSessionOnlineMessage = { content: sessionInfoMsg, timestamp: new Date().getTime() }
                logger.debug("Received client session.online event. Details:", sessionInfoMsg)
                
                const existingSession = sessionRepo.getSession(sessionInfoMsg.sessionId)                
                if (existingSession && existingSession.status === status.session.online) {

                    // just update the session status if it already exists                        
                    // check whether the attendants assigned are still online
                    let attendantCount = 0                    
                    existingSession.assignedAttendants.forEach(attId => {
                        if(attendatScheduler.isAttendantAssignedToSession(attId, existingSession)) {
                            attendantCount++
                        }
                    })

                    if (attendantCount > 0) { //if there are at least one more attendant available, just update the session
                        existingSession.status = sessionInfoMsg.status
                        logger.debug("Received client keep alive. Just broadcasting to attendants. Details:", existingSession)
                        mqttClient.publish(`${existingSession.sessionTopic}/client/control`, { instruction: instructions.session.update, sessionInfo: existingSession })
                    
                    }else{ //if the attendants are not available anymore, publish an abort message
                        existingSession.status = status.session.aborted
                        mqttClient.publish(`${existingSession.sessionTopic}/client/control`, { instruction: instructions.session.aborted.unavailableAttendants, sessionInfo: existingSession })
                    }
                    sessionRepo.upsert(existingSession.sessionTopic, existingSession)
                    return
                }
                
                if (!sessionInfoMsg.sessionTopic) {
                    logger.debug('Expired session attempt to refresh. Sending abort control message. Details:', sessionInfoMsg);
                    // notify the clients of the session expiration
                    _self.expireSession(sessionInfoMsg)
                    return
                }

                logger.debug("New session received. Details: ", sessionInfoMsg)    
                // registers the creation of the session for the chat
                let sessionInfo = JSON.parse(JSON.stringify(sessionInfoMsg))
                sessionInfo.createdAt = new Date().getTime()
                sessionInfo.status = status.session.waitingAttendantsAssignment
                sessionInfo.sessionTemplate = _self.resolveChatTemplate() //could be customized to have more than one attendant
                sessionInfo.assignedAttendants = []
                                
                sessionRepo.upsert(sessionInfoMsg.sessionTopic, sessionInfo)
                
                // subscribe for the item expiration, which will be the also the session expiration
                manuh.unsubscribe(sessionRepo.getDeletionNotificationTopic(), "SessionCoordinator")
                manuh.subscribe(sessionRepo.getDeletionNotificationTopic(), "SessionCoordinator", msg => {
                    // notify the clients of the session expiration
                    _self.expireSession(msg.value)
                })

                logger.debug("Chat session created and persisted. Details: ", sessionInfo)                    
                
                // listen for session control informations/instructions
                mqttClient.subscribe(`${sessionInfo.sessionTopic}/server/control`, (msg) => {
                    if (msg.instruction === instructions.attendant.unavailableAttendants) {
                        logger.info("No attendants available for this session. Aborting.")
                        msg.sessionInfo.status = status.session.aborted

                        sessionRepo.upsert(msg.sessionInfo.sessionTopic, msg.sessionInfo)
                        
                        //notify the customer that the session cannot be started due to lack of available attendant
                        mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: instructions.session.aborted.unavailableAttendants, sessionInfo: msg.sessionInfo })

                    // ATTENDANT ASSIGNED
                    }else if (msg.instruction === instructions.attendant.assigned) {
                        logger.debug("Attendant successfully assigned. Details:", msg.attendantInfo)                            
                        let sessionInfoAssignment = sessionRepo.getSession(msg.sessionInfo.sessionId)
                        if (!sessionInfoAssignment) {
                            console.log('\n\n\n===========',msg.sessionInfo,"\n\n\n\n\n");
                            
                        }
                        if (sessionInfoAssignment.assignedAttendants.indexOf(msg.attendantInfo.id) === -1) {
                            sessionInfoAssignment.assignedAttendants.push(msg.attendantInfo.id)                                                
                        }
                        sessionRepo.upsert(msg.sessionInfo.sessionTopic, sessionInfoAssignment)

                        if (_self.isSessionSetupReady(sessionInfoAssignment)) {
                            sessionInfoAssignment.status = status.session.online
                            sessionRepo.upsert(sessionInfoAssignment.sessionTopic, sessionInfoAssignment)
                            // notify all the interested parts in client that the session is ready and they can start to chat around
                            mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: instructions.session.ready, sessionInfo: sessionInfoAssignment })
                        }

                    }
                }, "session-coordinator")

                // notify that the chat session is ready and ask for the distributor to allocate the attendants
                logger.debug("Notify the attendant scheduler that the session is ready to have attendants assigned. Details: ", sessionInfo)
                mqttClient.publish(topics.server.attendants.request, sessionInfo)
            })

            _self.status = 2            
            ready()      

        }else{
            logger.debug("Sessions Coordinator already started. Ignoring start request...")
            return ready()
        }


    },

    generateSessionID: function() {
        return uuidv1();
    },
    
    resolveChatTemplate: function() {
        return {
            customersAllowed: 1,
            attendants: [{
                type: attendantTypes.support.firstLevel,
                required: true
            }]            
        }
    },

    expireSession: function(sessionInfo) {
        sessionInfo.status = status.session.aborted
        const expirationInstructionMsg = { instruction: instructions.session.aborted.expired, sessionInfo: sessionInfo }
        this.mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, expirationInstructionMsg)
        
        // notify the server components of the session expiration
        this.mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, expirationInstructionMsg)
        
        logger.debug(`Session expiration sent to ${sessionInfo.sessionTopic}/client/control and ${sessionInfo.sessionTopic}/server/control. Message:`, expirationInstructionMsg)
    },

    isSessionSetupReady: function(sessionInfo) {
        return true
    },

}
