const logger = require('console-server')

const topics = require('./lib/topics')
const status = require('./lib/status')
const DatabaseProvider = require('./lib/database-provider');
const databaseCatalog = require('./lib/database-catalog')
const dbPrefix = "/" + topics.server.sessions._path

const MongoClient = require('mongodb').MongoClient;
const url = process.env.MONGO_CONNECTION_URL;
const dbName = 'chimpassist';
const client = new MongoClient(url);

logger.info("Session database initialized. Details: databaseFile:", databaseCatalog.sessionDatabase)


let sessionRepository = {}
sessionRepository.sessionKeepAliveTime = process.env.SESSION_KEEP_ALIVE_TIME || 10*60*1000
sessionRepository.init = () => {
    const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
    db.insert(dbPrefix, {})
}

sessionRepository.upsert = (key, session) => {
    const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
    db.insert("/" + key, session, true, sessionRepository.sessionKeepAliveTime)
}

sessionRepository.getSession = (key) => {
    const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
    return db.get("/" + key)
}

sessionRepository.getSessionsByStatus = (statusParam) => {
     try {       
        const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
        let filteredSessions = []
        const sessionsData = db.get(dbPrefix)                        

        if (Object.keys(sessionsData).length > 0) {
            
            const sessions = Object.keys(sessionsData).map(customerId => sessionsData[customerId])
            sessions.forEach(session => {
                if (session.status === statusParam) {
                    filteredSessions.push(session)
                }
            })
        }

        return filteredSessions;            
        
    } catch (error) {
        logger.error("Error accessing database. Details:", error)
        throw "Error accessing session database"
    }
}

sessionRepository.getOnlineSessions = () => {
    return sessionRepository.getSessionsByStatus(status.session.online)
}

sessionRepository.getPendingSessions = () => {
    return sessionRepository.getSessionsByStatus(status.session.waitingAttendantsAssignment)
}

sessionRepository.getSession = (idSession) => {
    try {       
        const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
        let resp = null
        const sessionsData = db.get(dbPrefix) 
        
        if (Object.keys(sessionsData).length > 0) {            
            const sessions = Object.keys(sessionsData).map(customerId => sessionsData[customerId])
            resp = sessions.filter(session => session.sessionId === idSession)            
        }
        if (resp && resp.length === 1) {
            return resp[0]
        }
        return null;            
        
    } catch (error) {
        logger.error("Error accessing database. Details:", error)
        throw "Error accessing session database"
    }
}

sessionRepository.getSessionsByCustomer = (customerId, offset, limit, receive) => {

    const db = new DatabaseProvider(databaseCatalog.sessionDatabase);

    client.connect((err) => {

        if (err) {
            return ready(err)
        }

        const dbMongo = client.db(dbName)
        const mongoCollection = dbMongo.collection('chat-messages')
        
        mongoCollection.aggregate([ 
            { $match: { "sessionInfo.customer.id": customerId} },
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

            //mix with online sessions that may or may not have receive messages
            let allSessions = docs.map(s => s.sessionInfo)            
            const customerData = db.get(dbPrefix)             
            if (customerData) {
                const session = customerData[customerId]
                if (session) {
                    const present = docs.filter(s => s.sessionId === session.sessionId)
                    if (present.length === 0) { // if the session hasnt already added
                        allSessions.push(session)
                    }        
                }
            }
            allSessions = allSessions.sort((a,b) => b.createdAt > a.createdAt).map(s => {
                delete s.sessionTemplate
                return s
            })
            
            receive(allSessions)
        })
    })
}
sessionRepository.getDeletionNotificationTopic = () => {
    const db = new DatabaseProvider(databaseCatalog.sessionDatabase);
    return db.deletionNotificationTopic
}

module.exports = sessionRepository