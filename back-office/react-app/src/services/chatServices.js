import mqttProvider from 'simple-mqtt-client'
import debug from 'debug'
import topics from '../topics'
// import { t } from 'i18next';
// import '../i18n.js'

// enable debug for browser, if running on it
window.localStorage ? window.localStorage.debug = process.env.REACT_APP_DEBUG : null
const fine = debug("chimp-assist-fine")

if (!process.env.REACT_APP_MQTT_BROKER_HOST) {
    console.error("REACT_APP_MQTT_BROKER_HOST not FOUND!")
    throw "REACT_APP_MQTT_BROKER_HOST var is not set. Please provide a MQTT broker host to connect"
}

const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"
const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
const baseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC


let chatServices = {
    _ready: false
}

mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, baseTopic, (_) => {    
    chatServices._ready = true
});

export default chatServices