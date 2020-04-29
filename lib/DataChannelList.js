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
        return this.getPaths().indexOf(path);
    }

    getPath(shortID) {
        return this.availablePaths[shortID];
    }
    getDataChannelList() {
        return this.availablePaths.map(createDataChannel)
    }
    getPaths() {
        return this.availablePaths.map(datachannelID => datachannelID.path)
    }


}

function createDataChannelList(app) {
    let paths = app.streambundle.getAvailablePaths().filter(path => app.getSelfPath(path) && path.split('.')[0] != 'notifications')
    let res = paths.map((path, index) => {
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
            path: path,
            shortID: index,
            unit: unit,
            type: type
        }
    })
    return res
}

function createDataChannel(datachannelID) {
    let unit = datachannelID.unit
    let type = datachannelID.type
    let res = {
        DataChannelID: createDataChannelID(datachannelID.path, datachannelID.shortID),
        Property: {
            DataChannelType: {
                Type: "Inst"
            },
            Format: {
                Type: type
            }
        }
    }
    if (unit) {
        res.Property.Unit = {
            UnitSymbol: unit
        }
    }
    return res
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