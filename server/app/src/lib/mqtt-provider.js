const mqtt = require('mqtt') 
const manuh = require('manuh')
const ManuhBridge = require('./manuh-bridge/manuh-bridge').ManuhBridge
const logger  = require('console-server')


module.exports = {
    init: function(mqttBrokerHost, mqttUserName, mqttPassword, mqttBaseTopic, readyCB) {        
        if (!mqttBrokerHost) {
            console.error("MQTT_BROKER_HOST not FOUND!")
            throw "var MQTT_BROKER_HOST var is not set. Please provide a MQTT broker host to connect"
        }

        const _self = this
        if (this.bootstrapStatus == 0) {
            this.bootstrapStatus = 1 //running bootstrap
            let mqttCredentials = undefined
            if (mqttUserName) {
                mqttCredentials = {
                    username: mqttUserName,
                    password: mqttPassword
                }
            }
            logger.debug("Connecting to MQTT with: \nMQTT_BROKER_HOST="+mqttBrokerHost, 
                                        "\nMQTT_USERNAME="+mqttUserName,
                                        "\nMQTT_PASSWORD="+mqttPassword,
                                        "\nMQTT_BASE_TOPIC="+mqttBaseTopic);            
                                        
            this.baseTopic = mqttBaseTopic || "chimpassist/demo"            
            logger.debug("baseTopic:", this.baseTopic)
            

            // Manuh Bridge MQTT config
            let hostArr = mqttBrokerHost.split("://")
            let proto = "mqtt"
            let port = null
            let host = hostArr[1]
            let context = ""
            if (hostArr[0].indexOf("https") != -1) {
                proto = "https"
            }else if (hostArr[0].indexOf("http") != -1) {
                proto = "http"
            }

            //port and host
            if (hostArr[1].indexOf(":") != -1) {
                let temp = hostArr[1].split(":")
                host = temp[0]
                if (temp[1].indexOf("/") != -1) {
                    port = temp[1].split("/")[0]
                }else{
                    port = temp[1]
                }
            }
            //context and host
            if (hostArr[1].indexOf("/") != -1) {
                let temp = hostArr[1].split("/")
                if (temp[0].indexOf(":") != -1) {
                    host = temp[0].split(":")[0]
                }else{
                    host = temp[0]
                }
                context = temp[1]
            }

            const manuhMQTTBridgeConfig = {
                protocol: proto,
                host: host,
                port: port,
                context: context
            }
            
            logger.debug('manuhMQTTBridgeConfig=',manuhMQTTBridgeConfig)
            this.manuhBridge = new ManuhBridge(manuh, manuhMQTTBridgeConfig, () => {

                this.manuhBridge.subscribeRemote2LocalTopics([ this.baseTopic + "/#" ]); //connect to manuh        
                this.mqttClient = mqtt.connect(mqttBrokerHost, mqttCredentials);
                this.mqttClient.on('connect', function (connack) {                        
                    
                    if (!connack) {
                        console.error(t("Error connecting to interaction bus"));
                        return;
                    }      
                    
                    if (_self.bootstrapStatus < 2) { //avoid calling every time the connection succeeds
                        _self.bootstrapStatus = 2 //bootstrap completed
                        logger.debug("connection succeed. Details:",connack)
                        readyCB(_self)
                    }else{
                        logger.debug("connected again. Details:",connack)
                    }                    
                })

            });                        
        }else{
            return readyCB(_self)
        }
    },
    publish: function(topic, msg) {
        if (!this.isReady()) {
            throw "mqttProvider not yet initiated. Call `init` method with correspondent parameters"
        }
        const topicToPublish = this.baseTopic + "/" + topic
        if (typeof(msg) !== "object") {
            throw "Could not publish non-objects to the chat mqtt provider"
        }
        this.mqttClient.publish(topicToPublish, JSON.stringify(msg))
    },
    subscribe: function(topic, onMessageReceived, subscriptionId="mqtt-provider") {
        if (!this.isReady()) {
            throw "mqttProvider not yet initiated. Call `init` method with correspondent parameters"
        }

        const topicToSubscribe = this.baseTopic + "/" + topic        
        manuh.subscribe(topicToSubscribe, subscriptionId, function(msg, _){            
            if (typeof(msg) === "string") {
                msg = JSON.parse(msg)
            }
            onMessageReceived(msg)              
        })
    },
    unsubscribe: function(topic, subscriptionId="mqtt-provider") {
        const topicToUnsubscribe = this.baseTopic + "/" + topic
        manuh.unsubscribe(topicToUnsubscribe, subscriptionId)
    },
    isReady: function() {
        return this.bootstrapStatus == 2;
    },
    baseTopic: null,
    mqttClient: null,
    manuhBridge: null,
    bootstrapStatus: 0,
}