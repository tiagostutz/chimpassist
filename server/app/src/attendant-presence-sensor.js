const logger = require('console-server')
const topics = require('./lib/topics')
const instructions = require('./lib/instructions')
const attendantRepo = require('./attendant-repo')

let attendantPresenceTimer = {}
let buffer = {}
module.exports = {

    status: 0,

    start: (mqttClientPresenceSystem, mqttClientChimpAssist, ready) => {        

        mqttClientPresenceSystem.subscribe(`${process.env.ATTENDANT_PRESENCE_TOPIC}`, async ({user}) => {
            // treat as a keep alive
            if (!buffer[user]) {
                buffer[user] = user
                
                logger.debug("Attendant external presence detector msg received. Message:", user)
                
                let attendant = await attendantRepo.getAttendantByEmail(user)
                if (attendant && !attendantPresenceTimer[user]) {
                    logger.debug("Attendant external sensor data found. Sending resume session command to client. Attendant:", attendant)
                    mqttClientChimpAssist.publish(`${topics.client.attendants.control}/${attendant.id}`, {
                        instruction: instructions.attendant.control.resume.activity_monitor_online
                    })                                
                }else{
                    //clean buffer
                    clearTimeout(attendantPresenceTimer[user])
                }
                
                setTimeout(() => delete buffer[user], 2000)
                const expireAttendant = ((attendantEmail) => () => { 
                    delete attendantPresenceTimer[attendantEmail] //remove the timer and the attendant presence register    
                })(user)
                attendantPresenceTimer[user] = setTimeout(() => expireAttendant(), 2*60*1000)
                
            }
        })

        mqttClientChimpAssist.subscribe(topics.server.attendants.online, ({attendantInfo}) => {        
            if (!attendantPresenceTimer[attendantInfo.email]) {
                logger.debug("No attendant external sensor data found. Sending remove terminate session command to client. Attendant:",attendantInfo)
                mqttClientChimpAssist.publish(`${topics.client.attendants.control}/${attendantInfo.id}`, {
                    instruction: instructions.attendant.control.terminate.activity_monitor_offline
                })
            }
        })

        ready()
    }
}