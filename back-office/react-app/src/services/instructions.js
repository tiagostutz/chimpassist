const charol = require('charol')
let instructions = {
    attendant: {
        assigned: null,
        unavailableAttendants: null,
        control: {
            terminate: {
                activity_monitor_offline: null
            }
        }
    },
    session: {
        ready: null,
        aborted: {
            unavailableAttendants: null,
            expired: null
        },
        update: null
    }
}
instructions = charol(instructions)
module.exports = instructions