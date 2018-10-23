const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const mqttProvider = require('simple-mqtt-client')

const DatabaseProvider = require('./lib/database-provider');
const topics = require('./lib/topics')
const status = require('./lib/status')
const databaseCatalog = require('./lib/database-catalog')
const instructions = require('./lib/instructions')


module.exports = {
    
    instanceID: uuidv1(),
    status: 0,
    db: null,
    dbPrefix: "/" + topics.server.attendants._path,
    attendantKeepAliveTime: process.env.ATTENDANT_KEEP_ALIVE_TIME || 30*1000,
    
    start: function(ready, timeout) {

        const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"
        const _self = this
        _self.attendantKeepAliveTime = timeout || _self.attendantKeepAliveTime
        if (_self.status === 0) {
            logger.info("Starting attendant-distributor...")
            logger.info("Attendant Scheduler Keep Alive parameter: ", _self.attendantKeepAliveTime)
            logger.info(`MQTT Provider params: 
                        MQTT_BROKER_HOST=${process.env.MQTT_BROKER_HOST} 
                        MQTT_USERNAME=${process.env.MQTT_USERNAME} 
                        MQTT_PASSWORD=${process.env.MQTT_PASSWORD}
                        MQTT_BASE_TOPIC=${mqttBaseTopic}`)
            _self.status = 1
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
                logger.info("MQTT connection ready.")
            
                _self.db = new DatabaseProvider(databaseCatalog.attendantDatabase)
                _self.db.insert(_self.dbPrefix, {})
                logger.info("Attendant database initialized. Details: databaseFile:", databaseCatalog.attendantDatabase)
            
                // listen for online attendants heartbit
                mqttClient.subscribe(topics.server.attendants.online, ({attendantInfo}) => {           
                    const attendantsRegistry = _self.db.get(_self.dbPrefix)
                    
                    //check whether the attendant is already registered and updates its status or register it for the first time                    
                    if (attendantsRegistry[attendantInfo.id]) {
                        // if the attendant is already registered, just set the status to online and refresh the keep alive
                        _self.db.insert(`${_self.dbPrefix}/${attendantInfo.id}`, { status: status.attendant.connection.online }, false, _self.attendantKeepAliveTime)
                    }else{
                        // register the attendant for the first time
                        attendantInfo.status = status.attendant.connection.online
                        attendantInfo.activeSessions = [] //initialize
                        
                        _self.db.insert(`${_self.dbPrefix}/${attendantInfo.id}`, attendantInfo, true, _self.attendantKeepAliveTime)
                        logger.debug("New attendant registered:", attendantInfo, JSON.stringify(attendantInfo,_self.db.get("/")))
                    }
                }, _self.instanceID)
                logger.debug("Online attendants listener initialized. Details: ",topics.server.attendants.online)

                // listen for session coordinator attendants request
                mqttClient.subscribe(topics.server.attendants.request, (sessionInfoRequest) => {
                    logger.debug("Attendant request received. Details: ", sessionInfoRequest)
            
                    let attendantsLoadOrdered = _self.getOrderedOnlineAttendants()       
                    
                    logger.debug("Online attendants: ", this.db.get(this.dbPrefix))
                    sessionInfoRequest.sessionTemplate.attendants.forEach(attendantTemplate => {
                        
                        // filter attendants of the current type and that are not currently in this session                        
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
                            logger.info("No attendant available that fills the requirements: ", attendantTemplate)
                            if (attendantTemplate.required) {
                                logger.warn("Required attendant not found.")
                                mqttClient.publish(`${sessionInfoRequest.sessionTopic}/server/control`, { instruction: instructions.attendant.unavailableAttendants, sessionInfo: sessionInfoRequest })
                            }
                        }
                    })

                }, _self.instanceID)
                logger.debug("Attendants assignment request listener initialized. Details: ", topics.server.attendants.request)

                // listen for attendants assignment response
                mqttClient.subscribe(topics.server.attendants.assign, (attendantAssignment) => {
                    const attendantsRegistry = _self.db.get(_self.dbPrefix)

                    //check whether that session has already been assigned to the attendant
                    const currentSession = attendantsRegistry[attendantAssignment.attendantInfo.id].activeSessions.filter(a => a.sessionTopic === attendantAssignment.sessionInfo.sessionTopic)
                    if (currentSession.length  === 0) {
                        // update attendant active sessions
                        attendantsRegistry[attendantAssignment.attendantInfo.id].activeSessions.push(attendantAssignment.sessionInfo)
                        _self.db.insert(`${_self.dbPrefix}/${attendantsRegistry[attendantAssignment.attendantInfo.id]}`, attendantsRegistry[attendantAssignment.attendantInfo.id], false, _self.attendantKeepAliveTime)
                        mqttClient.publish(`${attendantAssignment.sessionInfo.sessionTopic}/server/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantAssignment.attendantInfo, sessionInfo: attendantAssignment.sessionInfo })
                        logger.debug("New session assigned to ", attendantAssignment.attendantInfo.id)
                    }else{
                        logger.debug("Assignment to this classe was successfully mande before. Details: ")
                    }
                }, _self.instanceID)
                logger.debug("Assignment confirm listener initialized.")

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

        const onlineattendantsList = Object.keys(attendantsRegistry).map(att => attendantsRegistry[att]).filter(att => att.status === status.attendant.connection.online)
        return onlineattendantsList.sort((a,b)  => a.activeSessions.length < b.activeSessions.length)
    }
}