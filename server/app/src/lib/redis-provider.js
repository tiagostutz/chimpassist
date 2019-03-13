const redis = require('async-redis')
const redisSync = require('redis')
const manuh = require('manuh')
const logger = require('console-server')
const topics = require('./topics')

const debug = require('debug')('debug-databaseProvider')

module.exports = class RedisProvider {
    constructor(databaseIndex) {
        this.databaseIndex = databaseIndex
        const redisPort = process.env.REDIS_PORT || 6379
        const redisHost = process.env.REDIS_HOST || redis
        this.client = redis.createClient({ hostname: redisHost, port: redisPort, db: this.databaseIndex })
        this.pubsub = redisSync.createClient({ hostname: redisHost, port: redisPort, db: this.databaseIndex })
        this.client.on("error", (err) => {
            console.error("Error " + err);
        })
        this.pubsub.send_command('config', ['SET','notify-keyspace-events','EKx'], (err) => {
            if (err) { 
                return (err) => {
                    console.error('Notifications not active');
                    if (err) { console.error(err.stack || err.message || err); }
                } 
            }
            const DEL_CHANNEL = "__keyevent@" + this.databaseIndex + "__:del"
            const EXPIRED_CHANNEL = "__keyevent@" + this.databaseIndex + "__:expired"
            this.pubsub.subscribe(EXPIRED_CHANNEL)
            this.pubsub.subscribe(DEL_CHANNEL)
            logger.info("REDIS Expiration Keys Subscribed. DEL CHANNEL: ", DEL_CHANNEL, " :: EXPIRED_CHANNEL: ", EXPIRED_CHANNEL)
            this.pubsub.on("message", (channel, key) => {
                debug('REDIS __keyevent fired. Expiration or deletion event expected.', channel, key);
                
                if (channel === DEL_CHANNEL) {
                    debug("Item deleted. Key=",key)
                    manuh.publish(this.deletionNotificationTopic, key)
                    debug("delete notification sent to",this.deletionNotificationTopic)                
                }else if (channel === EXPIRED_CHANNEL) {
                    debug("Item deleted. Key=",key)
                    manuh.publish(this.deletionNotificationTopic, key)
                    debug("expire notification sent to",this.deletionNotificationTopic)                
                }
            })
        })
        this.deletionNotificationTopic = `${topics.server.infra.database.delete}/${this.databaseIndex}`
    }
    async insert(key, value, override=true, ttl=0) {
        try {

            debug(`inserting data. Details: key=${key} value=${JSON.stringify(value)} override=${override} ttl=${ttl}`)
            const hasKey = await this.client.get(key)
            if (override || !hasKey) {
                this.client.set(key, JSON.stringify(value))
            }
            if (ttl > 0) {
                debug("configuring expiration for data. TTL: ", ttl )
                this.client.expire(key, ttl)
            }
            debug(`Data inserted. Details: key=${key} value=${JSON.stringify(await this.client.get(key))}`)    

        } catch (error) {
            logger.error("Error INSERT key from RedisProvider:", error)
            return null
        }
    }

    async allValues() {
        try {            
            const keys = await this.client.keys('*')
            let values = []
            for (let index = 0; index < keys.length; index++) {
                const element = await this.client.get(keys[index])
                const jsonElement = JSON.parse(element)                
                if (jsonElement.id) {
                    values.push(jsonElement)
                }
            }
            return values
        } catch (error) {
            logger.error("Error allValues() from RedisProvider:", error);            
            return null
        }
    }

    async get(key) {
        try {
            return JSON.parse(await this.client.get(key))
        } catch (error) {
            logger.error("Error GET key from RedisProvider:", error)
            return null
        }
    }
    delete(key) {
        try {
            return this.client.del(key)
        } catch (error) {
            logger.error("Error DELETE key from RedisProvider:", error)
            return null
        }
    }
}