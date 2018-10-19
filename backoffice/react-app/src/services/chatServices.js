import mqtt from 'mqtt'
import manuh from 'manuh'
import { ManuhBridge } from 'manuh-bridge-mqtt';
import { t } from 'i18next';
import debug from 'debug'

import '../i18n.js'

// enable debug for browser, if running on it
window.localStorage ? window.localStorage.debug = process.env.REACT_APP_DEBUG : null
const fine = debug("chimp-assist-fine")

if (!process.env.REACT_APP_MQTT_BROKER_HOST) {
    console.error("REACT_APP_MQTT_BROKER_HOST not FOUND!")
    throw "var REACT_APP_MQTT_BROKER_HOST var is not set. Please provide a MQTT broker host to connect"
}

export default {
    init: function(readyCB) {
        const _self = this
        if (this.serviceBootstrapStatus == 0) {
            this.serviceBootstrapStatus = 1 //running bootstrap
            let mqttCredentials = undefined
            if (process.env.REACT_APP_MQTT_USERNAME) {
                mqttCredentials = {
                    username: process.env.REACT_APP_MQTT_USERNAME,
                    password: process.env.REACT_APP_MQTT_PASSWORD
                }
            }
            fine("Connecting to MQTT with: \nREACT_APP_MQTT_BROKER_HOST="+process.env.REACT_APP_MQTT_BROKER_HOST, 
                                        "\nREACT_APP_MQTT_USERNAME="+process.env.REACT_APP_MQTT_USERNAME,
                                        "\nREACT_APP_MQTT_PASSWORD="+process.env.REACT_APP_MQTT_PASSWORD,
                                        "\nREACT_APP_MQTT_BASE_TOPIC="+process.env.REACT_APP_MQTT_BASE_TOPIC);            
                                        
            this.baseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC || "chimpassist/demo"
            fine("baseTopic:", this.baseTopic)
            

            // Manuh Bridge MQTT config
            let hostArr = process.env.REACT_APP_MQTT_BROKER_HOST.split("://")
            let proto = "ws"
            let port = null
            let host = hostArr[1]
            let context = "mqtt"
            if (hostArr[0].indexOf("https") != -1) {
                proto = "https"
            }

            //port and host
            if (hostArr[1].indexOf(":") != -1) {
                host = hostArr[0]
                let temp = hostArr[1].split(":")
                if (temp.indexOf("/") != -1) {
                    port = temp[1].split("/")[0]
                }else{
                    port = temp[1]
                }
            }

            //context and host
            if (hostArr[1].indexOf("/") != -1) {
                let temp = hostArr[1].split("/")
                context = temp[1]
                host = temp[0]
            }
            const manuhMQTTBridgeConfig = {
                protocol: proto,
                host: host,
                port: port,
                context: context
            }
            
            this.manuhBridge = new ManuhBridge(manuh, manuhMQTTBridgeConfig);                        
            fine('manuhMQTTBridgeConfig=',manuhMQTTBridgeConfig)

            this.mqttClient = mqtt.connect(process.env.REACT_APP_MQTT_BROKER_HOST, mqttCredentials);

            this.mqttClient.on('connect', function (connack) {                        
                
                if (!connack) {
                    console.error(t("Error connecting to interaction bus"), err);
                    return;
                }                          
                _self.serviceBootstrapStatus = 2 //bootstrap completed
                fine("connection succeed. Details:",connack)
            })
        }
        return readyCB(_self.mqttClient, _self.manuhBridge)
    },
    resolveChat: function(costumerId, agentId) {
        
    },
    sendMessage: function(chatChannel, msg) {
        this.init((mqttClient, _) => {
            mqttClient.publish(`${this.baseTopic}/chats/${chatChannel}`, msg)
        });        
    },
    subscribeToChannel: function(chatChannel, onMessageReceived) {
        this.init((_, manuhBridge) => {
            const topicToSubscribe = `${this.baseTopic}/chats/${chatChannel}`
            manuhBridge.subscribeRemote2LocalTopics([ `${this.baseTopic}/chats/#` ]);
            
            manuh.subscribe(topicToSubscribe, "chatService", function(msg, _){
                onMessageReceived(msg)              
            })
        })

    },
    isReady: function() {
        return this.serviceBootstrapStatus == 2;
    },
    baseTopic: null,
    mqttClient: null,
    manuhBridge: null,
    serviceBootstrapStatus: 0,
}