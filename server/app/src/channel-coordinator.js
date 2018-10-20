const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const JsonDB = require('node-json-db');

const mqttProvider = require('./mqtt-provider')
const topics = require('./topics')
const databaseCatalog = require('./databaseCatalog')


const generateChannelID = () => {
    return uuidv1();
}

module.exports = {
    status: 0,
    db: null,
    start: function(ready) {

        const _self = this
        if (this.status === 0) {
            logger.info("Starting channel-coordinator...")
            _self.status = 1
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, () => {    
                logger.info("MQTT connection ready.")
            
                _self.db = new JsonDB(databaseCatalog.channelDatabase, true, false);
                _self.db.push("/" + topics.server.channels._path, {})
                logger.info("Channel database initialized. Details: databaseFile:", databaseCatalog.channelDatabase)
            
                // listens for chat requests
                mqttProvider.subscribe(topics.server.channels.request, (msg) => {
                    logger.debug("Chat channel request received. Details: ", msg)
                    const channelTopic = `${topics.server.channels._path}/${msg.userRequesting}/${generateChannelID()}`
            
                    // registers the creation of the channel for the chat
                    const channelCreationData = { "createdAt": new Date().getTime(), "status": "pending" }
                    _self.db.push("/" + channelTopic, channelCreationData, false)
                    logger.debug("Chat channel creation persisted. Details: ", channelCreationData)                    

                    // response to the chat channel creation
                    mqttProvider.publish(msg.responseTopic, channelTopic)
                })

                _self.status = 2
                return ready()
            
            })
        }else{
            logger.warn("Channel Coordinator already started. Ignoring start request...")
            return ready()
        }

    },
    getOnlineChannels: function() {
        try {            
            const allUsersChats = this.db.getData("/" + topics.server.channels._path)
            return Object.keys(allUsersChats).map(userId => {
                return Object.keys(allUsersChats[userId]).filter(chat => allUsersChats[userId][chat].status === "online")
            })
        } catch (error) {
            logger.error("Error accessing database. Details:", error)
            throw "Error accessing channel database"
        }
    }
}