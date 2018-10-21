const logger = require('console-server')
const uuidv1 = require('uuid/v1');

const DatabaseProvider = require('./lib/database-provider');
const mqttProvider = require('./lib/mqtt-provider')
const topics = require('./lib/topics')
const databaseCatalog = require('./lib/database-catalog')
const status = require('./lib/status')
const attendatTypes = require('./lib/attendant-types')
const sessionInstructions = require('./lib/session-instructions')


const generateSessionID = () => {
    return uuidv1();
}

module.exports = {

    status: 0,
    db: null,
    sessionKeepAliveTime: process.env.SESSION_KEEP_ALIVE_TIME || 10*60*1000,

    start: function(ready) {

        const _self = this
        if (_self.status === 0) {
            logger.info("Starting session-coordinator...")
            _self.status = 1
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                logger.info("MQTT connection ready.")
            
                _self.db = new DatabaseProvider(databaseCatalog.sessionDatabase);
                _self.db.insert("/" + topics.server.sessions._path, {})
                logger.info("Session database initialized. Details: databaseFile:", databaseCatalog.sessionDatabase)
            
                // listens for chat requests
                mqttClient.subscribe(topics.server.sessions.request, (msg) => {
                    logger.debug("Chat session request received. Details: ", msg)
                    const sessionTopic = `${topics.server.sessions._path}/${msg.customerId}/${generateSessionID()}`
            
                    // registers the creation of the session for the chat
                    const sessionInfo = { 
                        "sessionTopic": sessionTopic,
                        "customerRequestID": msg.requestID,
                        "customerId": msg.customerId,
                        "createdAt": new Date().getTime(), 
                        "status": status.session.waitingAttendantsAssignment,
                        "sessionTemplate": _self.resolveChatTemplate(), //could be customized to have more than one attendant
                        "assignedAttendants": []
                    }
                    _self.db.insert("/" + sessionTopic, sessionInfo, true, _self.sessionKeepAliveTime)
                    
                    logger.debug("Chat session created and persisted. Details: ", sessionInfo)                    
                    
                    // listen for session control informations/instructions
                    logger.debug("Subscribing to session control topic: ", `${sessionInfo.sessionTopic}/control`)
                    mqttClient.subscribe(`${sessionInfo.sessionTopic}/control`, (msg) => {

                        if (msg.instruction === sessionInstructions.close.unavailableAttendants) {
                            logger.warn("No attendants available for this session. Aborting.")
                            msg.sessionInfo.status = status.session.aborted
                            _self.db.insert("/" + msg.sessionInfo.sessionTopic, msg.sessionInfo, true, _self.sessionKeepAliveTime)

                            //notify the customer that the session cannot be started due to lack of available attendant
                            mqttClient.publish(`${topics.client.sessions._path}/${msg.sessionInfo.customerId}/${msg.sessionInfo.customerRequestID}`, { update: msg.instruction, sessionInfo: msg.sessionInfo })

                        // ATTENDANT ASSIGNED
                        }else if (msg.instruction === sessionInstructions.attendant.assigned) {
                            logger.debug("Attendant assignment successfully. Details:", msg.attendantInfo)                            
                            let sessionInfoAssignment = _self.db.get("/" + msg.sessionInfo.sessionTopic)
                            sessionInfoAssignment.assignedAttendants.push(msg.attendantInfo)
                            _self.db.insert("/" + msg.sessionInfo.sessionTopic, sessionInfoAssignment, true, _self.sessionKeepAliveTime)

                            _self.evalSessionSetupReady(sessionInfoAssignment)
                        }
                    })

                    // notify that the chat session is ready and ask for the distributor to allocate the attendants
                    logger.debug("Notify the attendant scheduler that the session is ready to have attendants assigned. Details: ", sessionInfo)
                    mqttClient.publish(topics.server.attendants.request, sessionInfo)
                })


                _self.status = 2
                return ready()
            
            })
        }else{
            logger.warn("Sessions Coordinator already started. Ignoring start request...")
            return ready()
        }

    },
    
    resolveChatTemplate: function() {
        return {
            customersAllowed: 1,
            attendants: [{
                type: attendatTypes.support.firstLevel,
                required: true
            }]            
        }
    },

    getOnlineSessions: function() {
        return this.getSessionByStatus(status.session.ready)
    },

    getPendingSessions: function() {
        return this.getSessionByStatus(status.session.waitingAttendantsAssignment)
    },

    getSessionByStatus: function(statusParam) {
         try {       
            let filteredSessions = []
            const sessionsData = this.db.get("/" + topics.server.sessions._path)                        
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

    evalSessionSetupReady: function(sessionTopic) {
        try {       
            let onlineSessions = []

            const sessionsData = this.db.get("/" + topics.server.sessions._path)            
            if (Object.keys(sessionsData).length > 0) {
                
                const customers = Object.keys(sessionsData).map(customerId => sessionsData[customerId])
                customers.forEach(customer => {
                    Object.keys(customer).filter(sessionId =>  {
                        if (customer[sessionId].status === status.session.waitingAttendantsAssignment) {
                            onlineSessions.push(session)
                        }
                    })
                })
            }

            return onlineSessions;
                
            
        } catch (error) {
            logger.error("Error accessing database. Details:", error)
            throw "Error accessing session database"
        }
    }
}
