const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const mqttProvider = require('simple-mqtt-client')

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
    sessionKeepAliveTime: process.env.SESSION_KEEP_ALIVE_TIME || 10*60*1000,

    start: function(ready) {

        const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"
        const _self = this
        if (_self.status === 0) {
            logger.info("Starting session-coordinator...")
            logger.info("Session Coordinator Keep Alive parameter: ", _self.sessionKeepAliveTime)
            _self.status = 1
            logger.info(`MQTT Provider params: 
                        MQTT_BROKER_HOST=${process.env.MQTT_BROKER_HOST} 
                        MQTT_USERNAME=${process.env.MQTT_USERNAME} 
                        MQTT_PASSWORD=${process.env.MQTT_PASSWORD}
                        MQTT_BASE_TOPIC=${mqttBaseTopic}`)
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
                logger.info("MQTT connection ready.")
            
                _self.db = new DatabaseProvider(databaseCatalog.sessionDatabase);
                _self.db.insert(_self.dbPrefix, {})
                logger.info("Session database initialized. Details: databaseFile:", databaseCatalog.sessionDatabase)
            
                // listens for chat requests
                mqttClient.subscribe(topics.server.sessions.request, (msg) => {
                    logger.debug("Chat session request received. Details: ", msg)
            
                    // registers the creation of the session for the chat
                    const sessionInfo = { 
                        "sessionTopic": msg.sessionTopic,
                        "sessionId": msg.sessionId,
                        "customerRequestID": msg.customerRequestID,
                        "customer": { 
                            id: msg.customer.id
                        },
                        "createdAt": new Date().getTime(), 
                        "status": status.session.waitingAttendantsAssignment,
                        "sessionTemplate": _self.resolveChatTemplate(), //could be customized to have more than one attendant
                        "assignedAttendants": []
                    }
                    _self.db.insert("/" + msg.sessionTopic, sessionInfo, true, _self.sessionKeepAliveTime)
                    
                    logger.debug("Chat session created and persisted. Details: ", sessionInfo)                    
                    
                    // listen for session control informations/instructions
                    mqttClient.subscribe(`${sessionInfo.sessionTopic}/backend/control`, (msg) => {
                        if (msg.instruction === instructions.attendant.unavailableAttendants) {
                            logger.info("No attendants available for this session. Aborting.")
                            msg.sessionInfo.status = status.session.aborted
                            _self.db.insert("/" + msg.sessionInfo.sessionTopic, msg.sessionInfo, true, _self.sessionKeepAliveTime)

                            //notify the customer that the session cannot be started due to lack of available attendant
                            mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: msg.instruction, sessionInfo: msg.sessionInfo })

                        // ATTENDANT ASSIGNED
                        }else if (msg.instruction === instructions.attendant.assigned) {
                            logger.debug("Attendant successfully assigned. Details:", msg.attendantInfo)                            
                            let sessionInfoAssignment = _self.db.get("/" + msg.sessionInfo.sessionTopic)
                            sessionInfoAssignment.assignedAttendants.push(msg.attendantInfo)
                            _self.db.insert("/" + msg.sessionInfo.sessionTopic, sessionInfoAssignment, true, _self.sessionKeepAliveTime)

                            if (_self.isSessionSetupReady(sessionInfoAssignment)) {
                                sessionInfoAssignment.status = status.session.ready
                                this.db.insert("/" + sessionInfoAssignment.sessionTopic, sessionInfoAssignment, true, this.sessionKeepAliveTime)

                                // notify all the interested parts that the session is ready and they can start to chat around
                                mqttClient.publish(`${sessionInfo.sessionTopic}/client/control`, { instruction: instructions.session.ready, sessionInfo: sessionInfoAssignment })
                            }
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

    getOnlineSessions: function() {
        return this.getSessionByStatus(status.session.ready)
    },

    getPendingSessions: function() {
        return this.getSessionByStatus(status.session.waitingAttendantsAssignment)
    },

    getSessionByStatus: function(statusParam) {
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

    isSessionSetupReady: function(sessionInfo) {
        return true
    }
}
