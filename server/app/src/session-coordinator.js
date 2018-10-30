const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const mqttProvider = require('simple-mqtt-client')
const manuh = require('manuh')

const DatabaseProvider = require('./lib/database-provider');
const topics = require('./lib/topics')
const databaseCatalog = require('./lib/database-catalog')
const status = require('./lib/status')
const attendantTypes = require('./lib/attendant-types')
const instructions = require('./lib/instructions')


module.exports = {

    status: 0,
    db: null,
    dbPrefix: "/" + topics.server.sessions._path,
    mqttClient: null,
    sessionKeepAliveTime: process.env.SESSION_KEEP_ALIVE_TIME || 10*60*1000,

    start: function(mqttClient, ready) {

        const _self = this
        if (_self.status < 2) {
            logger.info("Starting session-coordinator...")
            logger.info("Session Coordinator Keep Alive parameter: ", _self.sessionKeepAliveTime)
            _self.status = 1
            _self.mqttClient = mqttClient

            logger.debug("MQTT client details:", mqttClient)
        
            _self.db = new DatabaseProvider(databaseCatalog.sessionDatabase);
            _self.db.insert(_self.dbPrefix, {})
            logger.info("Session database initialized. Details: databaseFile:", databaseCatalog.sessionDatabase)
        
            // listens for chat requests
            mqttClient.subscribe(topics.server.sessions.online, sessionInfoMsg => {
                
                const existingSession = _self.db.get("/" + sessionInfoMsg.sessionTopic)
                if (existingSession && existingSession.status === status.session.online) {

                    // just update the session status if it already exists                        
                    existingSession.status = sessionInfoMsg.status
                    _self.db.insert("/" + existingSession.sessionTopic, existingSession, true, _self.sessionKeepAliveTime)
                    mqttClient.publish(`${existingSession.sessionTopic}/client/control`, { instruction: instructions.session.update, sessionInfo: existingSession })
                    return
                }else if (!sessionInfoMsg.sessionTopic) {
                    logger.debug('Expired session attempt to refresh. Sending abort control message');
                    // notify the clients of the session expiration
                    _self.expireSession(sessionInfoMsg)
                    return
                }

                logger.debug("New session received. Details: ", sessionInfoMsg)    
                // registers the creation of the session for the chat
                const sessionInfo = Object.assign(sessionInfoMsg,{
                                    "createdAt": new Date().getTime(), 
                                    "status": status.session.waitingAttendantsAssignment,
                                    "sessionTemplate": _self.resolveChatTemplate(), //could be customized to have more than one attendant
                                    "assignedAttendants": []
                                });
                
                _self.db.insert("/" + sessionInfoMsg.sessionTopic, sessionInfo, true, _self.sessionKeepAliveTime)
                
                // subscribe for the item expiration, which will be the also the session expiration
                manuh.unsubscribe(_self.db.deletionTopicNotification, "SessionCoordinator")
                manuh.subscribe(_self.db.deletionTopicNotification, "SessionCoordinator", msg => {
                    // notify the clients of the session expiration
                    _self.expireSession(msg.value)
                })

                logger.debug("Chat session created and persisted. Details: ", sessionInfo)                    
                
                // listen for session control informations/instructions
                mqttClient.subscribe(`${sessionInfo.sessionTopic}/server/control`, (msg) => {
                    if (msg.instruction === instructions.attendant.unavailableAttendants) {
                        logger.info("No attendants available for this session. Aborting.")
                        msg.sessionInfo.status = status.session.aborted

                        _self.db.insert("/" + msg.sessionInfo.sessionTopic, msg.sessionInfo, true, _self.sessionKeepAliveTime)
                        
                        //notify the customer that the session cannot be started due to lack of available attendant
                        mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: instructions.session.aborted.unavailableAttendants, sessionInfo: msg.sessionInfo })

                    // ATTENDANT ASSIGNED
                    }else if (msg.instruction === instructions.attendant.assigned) {
                        logger.debug("Attendant successfully assigned. Details:", msg.attendantInfo)                            
                        let sessionInfoAssignment = _self.db.get("/" + msg.sessionInfo.sessionTopic)
                        sessionInfoAssignment.assignedAttendants.push(msg.attendantInfo)
                        
                        _self.db.insert("/" + msg.sessionInfo.sessionTopic, sessionInfoAssignment, true, _self.sessionKeepAliveTime)


                        if (_self.isSessionSetupReady(sessionInfoAssignment)) {
                            sessionInfoAssignment.status = status.session.online
                            this.db.insert("/" + sessionInfoAssignment.sessionTopic, sessionInfoAssignment, true, this.sessionKeepAliveTime)
                            // notify all the interested parts in client that the session is ready and they can start to chat around
                            mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: instructions.session.ready, sessionInfo: sessionInfoAssignment })
                            // notify all the interested parts that in server the session is ready and they can start to chat around
                            mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, { instruction: instructions.session.ready, sessionInfo: sessionInfoAssignment })
                            
                            // Client Handshake listener
                            mqttClient.subscribe(`${sessionInfo.sessionTopic}/status`, sessionInfo => {
                                _self.db.insert("/" + msg.sessionTopic,sessionInfo, true, _self.sessionKeepAliveTime)                                    
                            })
                        }

                    }
                }, "session-coordinator")

                // notify that the chat session is ready and ask for the distributor to allocate the attendants
                logger.debug("Notify the attendant scheduler that the session is ready to have attendants assigned. Details: ", sessionInfo)
                mqttClient.publish(topics.server.attendants.request, sessionInfo)
            })

            _self.status = 2            
            return ready()

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

    getOnlineSessions: function() {
        return this.getSessionsByStatus(status.session.online)
    },

    getPendingSessions: function() {
        return this.getSessionsByStatus(status.session.waitingAttendantsAssignment)
    },

    getSessionsByStatus: function(statusParam) {
         try {       
            let filteredSessions = []
            const sessionsData = this.db.get(this.dbPrefix)                        
            if (Object.keys(sessionsData).length > 0) {
                
                const customers = Object.keys(sessionsData).map(customerId => sessionsData[customerId])
                customers.forEach(customer => {
                    Object.keys(customer).filter(sessionId =>  {
                        if (customer[sessionId].status === statusParam) {
                            filteredSessions.push(customer[sessionId])
                        }
                    })
                })
            }

            return filteredSessions;
                
            
        } catch (error) {
            logger.error("Error accessing database. Details:", error)
            throw "Error accessing session database"
        }
    },

    getSession: function(id) {
        try {       
            let resp = null
            const sessionsData = this.db.get(this.dbPrefix) 
            if (Object.keys(sessionsData).length > 0) {
                
                const customers = Object.keys(sessionsData).map(customerId => sessionsData[customerId])
                customers.forEach(customer => {
                    Object.keys(customer).forEach(sessionId =>  {
                        if (sessionId === id) {                            
                            resp = customer[sessionId]
                        }
                    })
                })
            }

            return resp;
                
            
        } catch (error) {
            logger.error("Error accessing database. Details:", error)
            throw "Error accessing session database"
        }
    },

    isSessionSetupReady: function(sessionInfo) {
        return true
    }
}
