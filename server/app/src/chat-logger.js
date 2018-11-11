const logger = require('console-server')
const topics = require('./lib/topics')
const MongoClient = require('mongodb').MongoClient;

let bufferedMessage = []

const url = 'mongodb://root:n4oehf4c1l!@localhost:27017/?authMechanism=SCRAM-SHA-1';
const dbName = 'chimpassist';
const client = new MongoClient(url);

module.exports = {

    mongoCollection: null,

    start: (mqttClient, ready) => {
        logger.info("Starting session chat logger...")

        client.connect((err) => {

            if (err) {
                throw err
            }
            
            logger.debug("chat-logger connected successfully to MongoDB");
            const db = client.db(dbName);
            const collection = db.collection('chat-messages')
            
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
            client.connect((err) => {
                if (err) {
                    return ready(err)
                }
    
                const db = client.db(dbName);
                this.mongoCollection = db.collection('chat-messages')
    
                return ready()
            })

        });

    },

    getSessionMessages: (sessionId, offset=0, limit, receive) => {
        
        this.mongoCollection.find({"sessionInfo.sessionId": sessionId})
                    .skip(parseInt(offset))
                    .limit(parseInt(limit))
                    .sort({"message.timestamp": -1})
        .toArray((err, docs) => {
            if (err) {
                return receive(null, err)
            }
            receive(docs)
            client.close();
        })
    },


    getCustomerMessages: (customerId, offset=0, limit, receive) => {
        client.connect((err) => {

            if (err) {
                throw err
            }

            const db = client.db(dbName);
            const collection = db.collection('chat-messages')

            collection.find({"sessionInfo.customer.id": customerId}, {"_id":0, "sessionInfo.sessionTemplate": 0, "sessionInfo.assignedAttendants":0})
                        .skip(parseInt(offset))
                        .limit(parseInt(limit))
                        .sort({"message.timestamp": 1})
            .toArray((err, docs) => {
                if (err) {
                    return receive(null, err)
                }
                receive(docs)
                client.close();
            });
        })
    }
}