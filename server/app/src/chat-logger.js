const logger = require('console-server')
const topics = require('./lib/topics')
const MongoClient = require('mongodb').MongoClient;

let bufferedMessage = []

const url = process.env.MONGO_CONNECTION_URL;
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
            mqttClient.subscribe(`${topics.server.sessions._path}/#`, msg => {
        
                if (msg.message) {
                    
                    // buffered insert to avoid duplicates
                    const key = "message.timestamp" + msg.message.timestamp + "message.from.id" + msg.message.from.id
                    if (bufferedMessage.length === 0 || bufferedMessage[0] !== key) {
                        
                        this.mongoCollection.insertOne(msg)                        
                        if (bufferedMessage[0] !== key) {                            
                            bufferedMessage = []
                            bufferedMessage.push(key)
                        }
                        
                    }
                }else if (msg.readMessages) {
                    msg.readMessages.forEach(m => {
                        this.mongoCollection.find({"sessionInfo.sessionId": msg.session.sessionId, "message.from.id": parseInt(m.from.id), "message.timestamp": m.timestamp})
                        .toArray((err, docs) => {
                            if (err) {
                                return receive(null, err)
                            }
                            if (docs.length === 1) {
                                docs[0].message.readAt = m.readAt
                                this.mongoCollection.update({ _id: docs[0]._id}, docs[0], (err, count) => err && console.error('Error marking the message as read. Details:', err, count))                                
                            }
                        })
                    })                
                }
                
            }, "chatLogger")
    
            const db = client.db(dbName);
            this.mongoCollection = db.collection('chat-messages')

            return ready()
        })

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
        })
    },


    getCustomerMessages: (customerId, offset=0, limit=50, receive) => {            
        let customerIdParsed = customerId
        if (!isNaN(customerIdParsed)) {
            customerIdParsed = parseInt(customerId)
        }
        
        this.mongoCollection.find({"sessionInfo.customer.id": customerIdParsed}, {"_id":0, "sessionInfo.sessionTemplate": 0, "sessionInfo.assignedAttendants":0})
                    .skip(parseInt(offset))
                    .limit(parseInt(limit))
                    .sort({"message.timestamp": 1})
        .toArray((err, docs) => {
            if (err) {
                
                return receive(null, err)
            }
            receive(docs)
        });
    }
}