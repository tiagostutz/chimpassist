const logger = require('console-server')
const topics = require('./lib/topics')
const attendantRepo = require('./attendant-repo')

let attendantPresenceTimer = []

module.exports = {

    status: 0,

    start: (mqttClientPresenceSystem, mqttClientChimpAssist, ready) => {        

        mqttClientPresenceSystem.subscribe(`${process.env.ATTENDANT_PRESENCE_TOPIC}`, ({user}) => {
            // treat as a keep alive
            let attendant = attendantRepo.getAttendantByEmail(user)
            if (attendant) {
                logger.debug("Attendant external presence detector msg received. Message:", user)
            }
        })

        mqttClientChimpAssist.subscribe(topics.server.attendants.online, ({attendantInfo}) => {           
            clearTimeout(attendantPresenceTimer[attendantInfo.email])
            const expireAttendant = ((attendantEmail) => function() { console.log('E-MAIL:::', attendantEmail) })(attendantInfo.email)
            attendantPresenceTimer[attendantInfo.email] = setTimeout(() => expireAttendant(), 9000)
        })

        ready()
    }
}