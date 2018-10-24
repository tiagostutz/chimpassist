const JsonDB = require('node-json-db');
const manuh = require('manuh')
const topics = require('./topics')

const debug = require('debug')('debug-databaseProvider')

module.exports = class DatabaseProvider {
    constructor(databaseName) {
        this.databaseName = databaseName
        this.db = new JsonDB(databaseName, true, false);
        this.deletionTopicNotification = `${topics.server.infra.database.delete}/${this.databaseName}`
        this.timers = {}
    }
    insert(key, value, override=true, ttl=0) {
        debug(`inserting data. Details: key=${key} value=${JSON.stringify(value)} override=${override} ttl=${ttl}`)
        this.db.push(key, value, override)

        if (this.timers[key]) { //clear TTL
            clearTimeout(this.timers[key])
        }

        if (ttl > 0) {
            debug("configuring expiration for data. TTL: ", ttl )
            this.timers[key] = setTimeout(() => {
                let deletedItem = { key: key, value: JSON.parse(JSON.stringify(this.get(key))) } //clone deleted object
                this.delete(key)
                debug("Item deleted. Key=",key)
                manuh.publish(this.deletionTopicNotification, deletedItem)
                debug("delete notification sent to",this.deletionTopicNotification)
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