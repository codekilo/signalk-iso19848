const _ = require("lodash");
class DataChannelList {
    constructor(app) {
        this.app = app

        this.availablePaths = createDataChannelList(app)
        this.time = new Date()

    }
    /**
    update the list by generating a new one and seeing if it has changed
    **/
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
    // get a list of just paths
    getPaths() {
        return this.availablePaths.map(datachannelID => datachannelID.path)
    }


}
/** create a list of signalK paths for which the server has data for self
also assigns each path a shortID for iso19848 and retrieves the unit and datatype 
 **/
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

module.exports = DataChannelList