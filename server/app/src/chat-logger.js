const logger = require('console-server')
const topics = require('./lib/topics')
const MongoClient = require('mongodb').MongoClient;

let bufferedMessage = []
module.exports = {

    start: (mqttClient, ready) => {
        logger.info("Starting session chat logger...")
        
        const url = 'mongodb://root:n4oehf4c1l!@localhost:27017/?authMechanism=SCRAM-SHA-1';
        const dbName = 'myproject';
        const client = new MongoClient(url);


        client.connect((err) => {

            if (err) {
                throw err
            }
            
            const db = client.db(dbName);
            const collection = db.collection('chat-messages')
            console.log("chat-logger connected successfully to MongoDB");
            
            mqttClient.subscribe(`${topics.server.sessions._path}/#`, msg => {
        
                if (msg.message) {
                    
                    // buffered insert to avoid duplicates
                    const key = "message.timestamp" + msg.message.timestamp + "message.from.id" + msg.message.from.id
                    if (bufferedMessage.length === 0 || bufferedMessage[0] !== key) {
                        
                        collection.insertOne(msg)                        
                        if (bufferedMessage[0] !== key) {                            
                            bufferedMessage = []
                            bufferedMessage.push(key)
                        }
                        
                    }
                }
                
            }, "chatLogger")

            logger.debug("Chat logger succesfully initialized.")
            return ready()

            // client.close();
        });

    }
}