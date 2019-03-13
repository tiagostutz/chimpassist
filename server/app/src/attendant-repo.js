const logger = require('console-server')
// const DatabaseProvider = require('./lib/database-provider')
const DatabaseProvider = require('./lib/redis-provider')
const databaseCatalog = require('./lib/database-catalog')

const topics = require('./lib/topics')
const dbPrefix = "/" + topics.server.attendants._path

logger.info("Attendant database initialized in Repo. Details: databaseFile:", databaseCatalog.attendantDatabase)

let attendantRepository = {}

attendantRepository.attendantPresenceKeepAliveTime = process.env.ATTENDANT_PRESENCE_KEEP_ALIVE_TIME || 30*1000
attendantRepository.attendantKeepAliveTime = process.env.ATTENDANT_KEEP_ALIVE_TIME || 30*1000

attendantRepository.upsert = (key, attendant) => {
    const db = new DatabaseProvider(databaseCatalog.attendantDatabase);
    db.insert("/" + key, attendant, true, attendantRepository.attendantKeepAliveTime)
}


attendantRepository.getAttendant = async (idAttendant) => {
    try {       
        const db = new DatabaseProvider(databaseCatalog.attendantDatabase);
        const key = `${_self.dbPrefix}/${idAttendant}`
        const attendant = await db.get(key) 
        
        return attendant            
        
    } catch (error) {
        logger.error("Error accessing database. Details:", error)
        throw "Error accessing session database"
    }
}

attendantRepository.getAttendantByEmail = async (attendantEmail) => {
    try {       
        const db = new DatabaseProvider(databaseCatalog.attendantDatabase);
        let resp = null
        const attendants = await db.allValues()
        
        if (attendants.length > 0) {            
            resp = attendants.filter(attendant => attendant.email === attendantEmail)            
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

attendantRepository.saveAttendantPresence = (attendantInfo) => {
    try {       
        const db = new DatabaseProvider(databaseCatalog.attendantPresenceDatabase);
        db.insert(attendantInfo.email, attendantInfo, true, attendantRepository.attendantPresenceKeepAliveTime)        
    } catch (error) {
        logger.error("Error accessing database. Details:", error)
        throw "Error accessing session database"
    }
}


attendantRepository.getAttendantPresenceRegisterByEmail = async (attendantEmail) => {
    try {       
        const db = new DatabaseProvider(databaseCatalog.attendantPresenceDatabase);
        let resp = null
        const attendants = await db.allValues()
        
        if (attendants.length > 0) {            
            resp = attendants.filter(attendant => attendant.email === attendantEmail)            
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

module.exports = attendantRepository