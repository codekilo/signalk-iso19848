const util = require('../util.js')
// create the JS object representation of the ISO19848 XML datachannellist
const createDataChannelList = function(mmsi, dataChannelList, author) {
  return {
    Package: {
      Header: {
        ShipID: mmsi,
        DataChannelListID: {
          ID: 'signalk/v1/api/iso19848/datachannelist.xml',
          TimeStamp: util.stripMiliSeconds(dataChannelList.time)
        },
        Author: author

      },
      DataChannelList: {
        DataChannel: getDataChannelList(dataChannelList)
      }
    }
  }
}

function getDataChannelList(dataChannelList) {
  return dataChannelList.availablePaths.map(createDataChannel)
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

exports.create = createDataChannelList