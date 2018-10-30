const logger = require('console-server')
const uuidv1 = require('uuid/v1');
const mqttProvider = require('simple-mqtt-client')
const manuh = require('manuh')

const DatabaseProvider = require('./lib/database-provider');
const topics = require('./lib/topics')
const databaseCatalog = require('./lib/database-catalog')
const status = require('./lib/status')
const attendantTypes = require('./lib/attendant-types')
const instructions = require('./lib/instructions')

module.exports = {

    start: () => {
        logger.info("Starting session chat logger...")
        const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, mqttClient => {    
            mqttProvider.subscribe(`${topics.server.sessions._path}/#`, msg => {
                console.log('===>>>', msg);
                
            }, "chatLogger")
        })
    }
}