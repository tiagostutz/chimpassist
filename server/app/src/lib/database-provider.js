const JsonDB = require('node-json-db');
const manuh = require('manuh')
const topics = require('./topics')

const debug = require('debug')('debug-databaseProvider')
const timers = {}
module.exports = class DatabaseProvider {
    constructor(databaseName) {
        this.databaseName = databaseName
        this.db = new JsonDB(databaseName, true, false);
        this.deletionNotificationTopic = `${topics.server.infra.database.delete}/${this.databaseName}`
    }
    insert(key, value, override=true, ttl=0) {
        debug(`inserting data. Details: key=${key} value=${JSON.stringify(value)} override=${override} ttl=${ttl}`)
        this.db.push(key, value, override)
        debug(`Data inserted. Details: key=${key} value=${JSON.stringify(this.db.getData(key))}`)

        if (timers[key]) { //clear TTL
            clearTimeout(timers[key])
        }

        if (ttl > 0) {
            debug("configuring expiration for data. TTL: ", ttl )
            timers[key] = setTimeout(() => {
                let deletedItem = { key: key, value: JSON.parse(JSON.stringify(this.get(key))) } //clone deleted object
                this.delete(key)
                debug("Item deleted. Key=",key)
                manuh.publish(this.deletionNotificationTopic, deletedItem)
                debug("delete notification sent to",this.deletionNotificationTopic)
            }, ttl)
        }
    }
    get(key) {
        try {
            return this.db.getData(key)            
        } catch (error) {
            return null
        }
    }
    delete(key) {
        this.db.delete(key)
    }
}