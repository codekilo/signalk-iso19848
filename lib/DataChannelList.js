const _ = require("lodash");
class DataChannelList {
    constructor(app) {
        this.app = app

        this.availablePaths = createDataChannelList(app)
        this.time = new Date()

    }
    update() {
        let temp = createDataChannelList(this.app)
        if (!_.isEqual(this.availablePaths, temp)) {
            this.availablePaths = temp
            this.time = new Date()
            this.app.debug('updating list')
        }
    }
    getShortID(path) {
        return this.availablePaths.indexOf(path);
    }

    getPath(shortID) {
        return this.availablePaths[shortID];
    }

    getDataChannelList() {
        return this.availablePaths.map((path, index) => createDataChannel(path, index, this.app))
    }



}

function createDataChannelList(app) {
    let paths = app.streambundle.getAvailablePaths().filter(path => app.getSelfPath(path) && path.split('.')[0] != 'notifications')
    return paths
}

function createDataChannel(path, shortID, app) {
    let meta = app.getSelfPath(path).meta
    let unit
    if (meta) {
        unit = app.getSelfPath(path).meta.units
    }
    let type = typeof app.getSelfPath(path).value
    let format = 'Decimal'
    if (path == 'navigation.datetime') {
        format = 'DateTime'
    } else if (type == 'string' || path == 'mmsi') {
        format = 'String'
    } else if (type == 'boolean') {
        format = 'Boolean'
    }
    return {
        DataChannelID: createDataChannelID(path, shortID),
        Property: {
            DataChannelType: {
                Type: "Inst"
            },
            Format: {
                Type: format
            },
            Unit: {
                UnitSymbol: unit
            }
        }
    }
}

function createDataChannelID(path, shortID) {
    let localID = path.replace(/\./g, '/')
    return {
        localID: localID,
        shortID: shortID,
        NameObject: {
            NamingRule: "SignalK"
        }
    }
}
module.exports = DataChannelList