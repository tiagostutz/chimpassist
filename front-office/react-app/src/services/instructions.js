const charol = require('charol')
let instructions = {
    attendant: {
        assigned: null,
        unavailableAttendants: null
    },
    session: {
        ready: null,
        aborted: {
            unavailableAttendants: null
        }
    }
}
instructions = charol(instructions)
module.exports = instructions