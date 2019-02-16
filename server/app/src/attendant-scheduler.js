const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const MongoClient = require('mongodb').MongoClient;

const DatabaseProvider = require('./lib/database-provider');
const topics = require('./lib/topics')
const status = require('./lib/status')
const databaseCatalog = require('./lib/database-catalog')
const instructions = require('./lib/instructions')

const sessionRepo = require('./session-repo')

const url = process.env.MONGO_CONNECTION_URL;
const dbName = 'chimpassist';
const client = new MongoClient(url);

module.exports = {
    
    instanceID: uuidv1(),
    status: 0,
    db: null,
    mongoCollection: null,
    dbPrefix: "/" + topics.server.attendants._path,
    attendantKeepAliveTime: process.env.ATTENDANT_KEEP_ALIVE_TIME || 30*1000,
    
    start: function(mqttClient, ready, timeout) {

        const _self = this
        _self.attendantKeepAliveTime = timeout || _self.attendantKeepAliveTime
        if (_self.status < 2) {
            logger.info("Starting attendant-distributor...")
            logger.info("Attendant Scheduler Keep Alive parameter: ", _self.attendantKeepAliveTime)
            logger.debug("MQTT client details:", mqttClient)
            _self.status = 1
        
            _self.db = new DatabaseProvider(databaseCatalog.attendantDatabase)
            _self.db.insert(_self.dbPrefix, {})
            logger.info("Attendant database initialized. Details: databaseFile:", databaseCatalog.attendantDatabase)
        
            // listen for online attendants heartbit
            mqttClient.subscribe(topics.server.attendants.online, ({attendantInfo}) => {           
                logger.debug("Receiving attendant keepAlive. Details: ", attendantInfo)
                const registerKey = `${_self.dbPrefix}/${attendantInfo.id}`
                let attendant = _self.db.get(registerKey)
                
                //check whether the attendant is already registered and updates its status or register it for the first time                    
                if (!attendant) { // register the attendant for the first time
                    attendant = attendantInfo
                    attendantInfo.tempActiveSessions = [] //initialize
                    
                    logger.debug("New attendant registered:", attendantInfo, JSON.stringify(attendantInfo,_self.db.get("/")))
                }
                // whether the attendant is or not already registered, just set the status to online and refresh the keep alive
                attendant.status = status.attendant.connection.online
                _self.db.insert(registerKey, attendant, true, _self.attendantKeepAliveTime)

            }, _self.instanceID)
            logger.debug("Online attendants listener initialized. Details: ",topics.server.attendants.online)

            // listen for session coordinator attendants request
            mqttClient.subscribe(topics.server.attendants.request, (sessionInfoRequest) => {
                logger.debug("Attendant request received. Details: ", sessionInfoRequest)
                logger.debug("All available attendants: ", JSON.stringify(_self.db.get(_self.dbPrefix)))
                _self.expireSessionAssignment(sessionInfoRequest.sessionTopic)
        
                //clear previous assignment for this session, if have                
                let attendantsLoadOrdered = _self.getOrderedOnlineAttendants()       
                logger.debug("Attendants load ordered: ", JSON.stringify(attendantsLoadOrdered))

                sessionInfoRequest.sessionTemplate.attendants.forEach(attendantTemplate => {
                    
                    // filter attendants of the current type and that are not currently in this session                        
                    const possibleAttendants = attendantsLoadOrdered.filter(a => a.type === attendantTemplate.type && !_self.isAttendantAssignedToSession(a.id, sessionInfoRequest))
                    if (possibleAttendants.length > 0) {

                        // clone the object to avoid updating the database object. The main goal here is to avoid that an attendent 
                        // is twice or more times requested
                        const possibleAttendantClone = JSON.parse(JSON.stringify(possibleAttendants[0]));
                        // temporary update current active sessions to avoid assign request duplication
                        possibleAttendantClone.tempActiveSessions.push(sessionInfoRequest.sessionTopic)
                        
                        // send assign message to attendant to this session
                        mqttClient.publish(`${topics.client.attendants.assign}/${possibleAttendantClone.id}`, sessionInfoRequest)
                    }else{
                        logger.info("No attendant available fills the requirements: ", attendantTemplate)
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
                
                // this is an inconsistent state that should rarely happen
                if (!attendantsRegistry[attendantAssignment.attendantInfo.id]) {
                    logger.warn("The attendant is no longer registered at the attendant registry. Skipping assignment...")
                    return
                }

                //check whether that session has already been assigned to the attendant
                const currentSession = this.resolveActiveSessions(attendantAssignment.attendantInfo.id).filter(a => a.sessionTopic === attendantAssignment.sessionInfo.sessionTopic)
                if (currentSession.length  === 0 && attendantsRegistry[attendantAssignment.attendantInfo.id]) {
                    // update attendant active sessions
                    attendantsRegistry[attendantAssignment.attendantInfo.id].tempActiveSessions.push(attendantAssignment.sessionInfo.sessionTopic)
                    _self.db.insert(`${_self.dbPrefix}/${attendantAssignment.attendantInfo.id}`, attendantsRegistry[attendantAssignment.attendantInfo.id], true, _self.attendantKeepAliveTime)
                    mqttClient.publish(`${attendantAssignment.sessionInfo.sessionTopic}/server/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantAssignment.attendantInfo, sessionInfo: attendantAssignment.sessionInfo })
                    
                    logger.debug("New session assigned to ", attendantAssignment.attendantInfo.id)
                    // listen for session expiration to update the attendants state
                    logger.debug(`Subscribing to ${attendantAssignment.sessionInfo.sessionTopic}/server/control for expiration notification and other controls`)
                    mqttClient.subscribe(`${attendantAssignment.sessionInfo.sessionTopic}/server/control`, msg => {
                        logger.debug(`Server session control message received. Instruction: ${msg.instruction}. Message: ${JSON.stringify(msg)}`)
                        
                        if (msg.instruction === instructions.session.aborted.expired) {
                            this.expireSessionAssignment(msg.sessionInfo.sessionTopic)
                        }
                    }, "attendant-scheduler")

                }else{
                    logger.debug("Assignment to this session was successfully mande before. Details: ")
                }
            }, _self.instanceID)
            logger.debug("Assignment confirm listener initialized.")

            _self.status = 2
            client.connect((err) => {

                if (err) {
                    return ready(err)
                }
                const db = client.db(dbName);
                this.mongoCollection = db.collection('chat-messages')
    
                ready()      
            })
        }else{
            logger.debug("Attendant Scheduler already started. Ignoring start request...")
            return ready()
        }

    },

    isAttendantAssignedToSession: function(attendantId, sessionInfo) {
        const attendantsRegistry = this.db.get(this.dbPrefix)
        
        if(!attendantsRegistry[attendantId]) {
            return false
        }

        const activeSessionsTopics = this.resolveActiveSessions(attendantId).map(s => s.sessionTopic)
        const assigningTopics = attendantsRegistry[attendantId].tempActiveSessions.map(s => s.sessionTopic)        
        return activeSessionsTopics.indexOf(sessionInfo.sessionTopic) !== -1 || assigningTopics.indexOf(sessionInfo.sessionTopic) !== -1
    },

    getAttendantsBySession: function(sessionInfo) {
        const attendantsRegistry = this.db.get(this.dbPrefix)
        if (!attendantsRegistry || Object.keys(attendantsRegistry).length === 0) {
            return []
        }
        return Object.keys(attendantsRegistry).filter(att => this.resolveActiveSessions(att.id).filter(as => as.sessionId === sessionInfo.sessionId).length>0 )
    },

    getOrderedOnlineAttendants: function() {
        const attendantsRegistry = this.db.get(this.dbPrefix)
        if (!attendantsRegistry || Object.keys(attendantsRegistry).length === 0) {
            return []
        }

        const onlineAttendantsList = Object.keys(attendantsRegistry).map(att => attendantsRegistry[att]).filter(att => att.status === status.attendant.connection.online)
        onlineAttendantsList.sort((a,b)  => this.resolveActiveSessions(a.id).length < this.resolveActiveSessions(b.id).length)
        return onlineAttendantsList
    },

    getSessionsByAttendant: function(attendantId, offset=0, limit=50, receive) {
        this.mongoCollection.aggregate([ 
            { $match: { "sessionInfo.assignedAttendants": parseInt(attendantId)} },
            { $group : { _id : "$sessionInfo.customer.id", sessionInfo: { $last: "$sessionInfo" } } }, 
            { $project: {"_id": 0, "sessionInfo.sessionTemplate": 0} },
            { $addFields: { "sessionInfo.lastMessages": [] } }
        ])
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .sort({"sessionInfo.createdAt": -1, "message.timestamp": -1})
        .toArray((err, docs) => {
            if (err) {
                return receive(null, err)
            }
            docs.map(d => {
                d.sessionInfo.status = status.session.aborted //put offline by default
                return d
            })    

            // retrieve current sessions
            let allSessions = docs.map(s => s.sessionInfo)            
            const attendantsRegistry = this.db.get(this.dbPrefix)
            if (attendantsRegistry) {
                allSessions = allSessions.concat(this.resolveActiveSessions(attendantId))
            }
            allSessions = allSessions.sort((a,b) => b.createdAt > a.createdAt).map(s => {
                delete s.sessionTemplate
                return s
            })

            receive(allSessions)
        });
    },


    expireSessionAssignment: function(sessionTopic) {
        logger.debug("Session expired; removing from attendants registry. Details: ", sessionTopic)
        let  allAttendants = this.db.get(this.dbPrefix)
        if (!allAttendants) {
            return
        }

        allAttendants = Object.keys(allAttendants).map(k => allAttendants[k])
        
        // remove the session from the attendants
        allAttendants.forEach(attendant => { 
            attendant.tempActiveSessions = attendant.tempActiveSessions.filter(st => st != sessionTopic)
            const registerKey = `${this.dbPrefix}/${attendant.id}`
            this.db.insert(registerKey, attendant, true, this.attendantKeepAliveTime)
        })
        logger.debug('Session Assignment Expired. Attendants: ', JSON.stringify(allAttendants))
    },

    resolveActiveSessions: function(attendantId) {
        const currentSessions = sessionRepo.getOnlineSessions()
        return currentSessions.filter(s => s.assignedAttendants.indexOf(attendantId) != -1)
    }
}