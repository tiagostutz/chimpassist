let mqttClient = null
mqttClient = mqtt.connect(process.env.REACT_APP_MQTT_BROKER_HOST, {
    username: 'edidatico',
    password: 'n@oeh!n4d4fac1l'
});
mqttClient.on('connect', function () {                        
    mqttClient.subscribe(`accounts/edidatico/costumer-service/#`, (err, granted) => {
        if (err) {
            console.error('Erro ao conectar-se ao barramento de interações:', err);
            return;
        }
    })
})

export default {
    resolveChat: (costumerId, agentId) => {
        
    },
    sendMessage: () => {

    },
    subscribeToChannel: (channelTopic) => {

    }
}