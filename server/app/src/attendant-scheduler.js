const logger = require('console-server')
const uuidv1 = require('uuid/v1');

const DatabaseProvider = require('./lib/database-provider');
const mqttProvider = require('./lib/mqtt-provider')
const topics = require('./lib/topics')
const status = require('./lib/status')
const databaseCatalog = require('./lib/database-catalog')
const sessionInstructions = require('./lib/session-instructions')


module.exports = {
    
    instanceID: uuidv1(),
    status: 0,
    db: null,
    dbPrefix: "/" + topics.server.attendants._path,
    attendantKeepAliveTime: process.env.ATTENDANT_KEEP_ALIVE_TIME || 30*1000,
    
    start: function(ready, timeout) {

        const _self = this
        _self.attendantKeepAliveTime = timeout || _self.attendantKeepAliveTime
        if (_self.status === 0) {
            logger.info("Starting attendant-distributor...")
            logger.info("Attendant Keep Alive parameter: ", _self.attendantKeepAliveTime)
            _self.status = 1
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                logger.info("MQTT connection ready.")
            
                _self.db = new DatabaseProvider(databaseCatalog.attendantDatabase)
                _self.db.insert(_self.dbPrefix, {})
                logger.info("Attendant database initialized. Details: databaseFile:", databaseCatalog.attendantDatabase)
            
                // listen for online attendants heartbit
                mqttClient.subscribe(topics.server.attendants.online, (msg) => {           
                    const attendantsRegistry = _self.db.get(_self.dbPrefix)
                    
                    //check whether the attendat is already registered and updates its status or register it for the first time
                    if (attendantsRegistry[msg.attendantInfo.id] && attendantsRegistry[msg.attendantInfo.id].status === status.attendant.connection.offline) {
                        _self.db.insert(`${_self.dbPrefix}/${msg.attendantInfo.id}`, { status: status.attendant.connection.online }, false, _self.attendantKeepAliveTime) //update the status
                    }else{
                        // register the attendant for the first time
                        msg.attendantInfo.status = status.attendant.connection.online
                        msg.activeSessions = []                        
                        
                        _self.db.insert(`${_self.dbPrefix}/${msg.attendantInfo.id}`, msg.attendantInfo, true, _self.attendantKeepAliveTime)
                    }
                }, _self.instanceID)
                logger.debug("Online attendants listener initialized. Details: ",topics.server.attendants.online)

                // listen for session coordinator attendants request
                mqttClient.subscribe(topics.server.attendants.request, (sessionInfoRequest) => {
                    logger.debug("Attendant request received. Details: ", sessionInfoRequest)
            
                    let attendantsLoadOrdered = _self.getOrderedOnlineAttendants()       
                    
                    sessionInfoRequest.sessionTemplate.attendants.forEach(attendantTemplate => {
                        // filter attendats of the current type and that are not currently in this session
                        const possibleAttendants = attendantsLoadOrdered.filter(a => a.type === attendantTemplate.type && !_self.isAttendantAssignedToSession(a, sessionInfoRequest))
                        if (possibleAttendants.length > 0) {

                            // clone the object to avoid updating the database object. The main goal here is to avoid that an attendent 
                            // is twice or more times requested
                            const possibleAttendantClone = JSON.parse(JSON.stringify(possibleAttendants[0]));
                            // temporary update current active sessions to avoid assign request duplication
                            possibleAttendantClone.activeSessions.push(sessionInfoRequest)
                            
                            // send assign message to attendant to this session
                            mqttClient.publish(`${topics.client.attendants.assign}/${possibleAttendantClone.id}`, sessionInfoRequest)
                        }else{
                            logger.warn("No attendant available that fills the requirements: ", attendantTemplate)
                            if (attendantTemplate.required) {
                                logger.warn("Required attendant not found.")
                                mqttClient.publish(`${sessionInfoRequest.sessionTopic}/control`, { instruction: sessionInstructions.close.unavailableAttendants, sessionInfo: sessionInfoRequest })
                            }
                        }
                    })

                }, _self.instanceID)
                logger.debug("Attendants assignment request listener initialized. Details: ", topics.server.attendants.request)

                // listen for attendants assignment response
                mqttClient.subscribe(topics.server.attendants.assign, (attendantAssignment) => {
                    const attendantsRegistry = _self.db.get(_self.dbPrefix)

                    // update attendant active sessions
                    attendantsRegistry[attendantAssignment.attendantInfo.id].activeSessions.push(attendantAssignment.sessionInfo)
                    _self.db.insert(`${_self.dbPrefix}/${attendantsRegistry[attendantAssignment.attendantInfo.id]}`, attendantsRegistry[attendantAssignment.attendantInfo.id], false, _self.attendantKeepAliveTime)
                    mqttClient.publish(`${attendantAssignment.sessionInfo.sessionTopic}/control`, { instruction: sessionInstructions.attendant.assigned, attendantInfo: attendantAssignment.attendantInfo, sessionInfo: attendantAssignment.sessionInfo })

                }, _self.instanceID)
                logger.debug("Assignment confirm listener initialized. Details: ", topics.server.attendants.assign)

                _self.status = 2
                ready()            
            })
        }else{
            logger.debug("Attendant Scheduler already started. Ignoring start request...")
            return ready()
        }

    },

    isAttendantAssignedToSession: function(attendant, sessionInfo) {
        const activeSessionsTopics = attendant.activeSessions.map(s => s.sessionTopic)
        return activeSessionsTopics.indexOf(sessionInfo.sessionTopic) !== -1
    },

    getOrderedOnlineAttendants: function() {
        const attendantsRegistry = this.db.get(this.dbPrefix)
        if (Object.keys(attendantsRegistry) === 0) {
            return []
        }

        const onlineAttendatsList = Object.keys(attendantsRegistry).map(att => attendantsRegistry[att]).filter(att => att.status === status.attendant.connection.online)
        return onlineAttendatsList.sort((a,b)  => a.activeSessions.length < b.activeSessions.length)
    }
}