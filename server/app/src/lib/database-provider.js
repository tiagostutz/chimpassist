const JsonDB = require('node-json-db');

module.exports = class DatabaseProvider {
    constructor(databaseName) {
        this.db = new JsonDB(databaseName, true, false);
        this.timers = {}
    }
    insert(key, value, override=true, ttl=0) {
        this.db.push(key, value, override)

        if (this.timers[key]) { //clear TTL
            clearTimeout(this.timers[key])
        }

        if (ttl > 0) {
            this.timers[key] = setTimeout(() => {
                this.delete(key)
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