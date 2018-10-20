const databaseFolder = process.env.JSON_DATABASE_FOLDER || "database-temp"

module.exports = {
    "channelDatabase": databaseFolder + "/channelDatabase"
}