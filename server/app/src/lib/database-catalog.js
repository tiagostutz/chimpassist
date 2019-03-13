const databaseFolder = process.env.JSON_DATABASE_FOLDER || "database-temp"

module.exports = {
    "sessionDatabase": databaseFolder + "/sessionDatabase",
    "attendantDatabase": 0,
    "attendantPresenceDatabase": 1
}