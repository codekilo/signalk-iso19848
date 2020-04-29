const util = require('../util.js')
const createTimeSeries = function(mmsi, paths, dataChannelList, data) {
    let dataChannelIDList = createDataChannelList(paths, dataChannelList)
    let dataset = createDataSets(data, dataChannelList)
    return {
        Package: {
            Header: {
                ShipID: mmsi
            },
            TimeSeriesData: {
                TabularData: {
                    NumberOfDataSet: dataset.length,
                    NumberOfDataChannel: dataChannelIDList.length,
                    DataChannelID: dataChannelIDList,
                    DataSet: dataset
                }

            }
        }
    }
}
exports.create = createTimeSeries

function createDataChannelList(paths, dataChannelList) {
    return paths.map((path, index) => {
        return createDataChannel(dataChannelList.getShortID(path), index)
    })
}

function createDataChannel(shortID, index) {
    return {
        $: {
            id: index
        },
        _: shortID
    }
}

function createDataSets(dataList, dataChannelList) {
    let dataset = {}
    dataList.forEach((data) => {
        let value = data.value
        let time = data.timestamp
        let shortID = dataChannelList.getShortID(data.path)
        let timestamp = util.stripMiliSeconds(new Date(time))
        if (!dataset[timestamp]) {
            dataset[timestamp] = new Array(dataList.length)
        }
        dataset[timestamp][shortID] = value
    })
    let res = Object.entries(dataset).map(([timestamp, values]) => {
        return createDataSet(timestamp, values)
    })
    return res
}

function createDataSet(timestamp, values) {
    return {
        $: {
            timeStamp: timestamp
        },
        Value: createValueList(values)
    }
}

function createValueList(values) {
    let res = new Array(values.length)
    for (var i = res.length; i >= 0; i--) {
        res[i] = createDataSetValue(values[i], i)
    }
    return res
}

function createDataSetValue(value, id) {
    if (value == null) {
        value = 'Null'
    }
    return {
        $: {
            ref: id
        },
        _: value
    }
}