const PLUGIN_ID = 'signalk-iso19848';
const PLUGIN_NAME = 'SignalK ISO 19848';
const xml2js = require('xml2js');
var builder = new xml2js.Builder();
const _ = require("lodash");
module.exports = function(app) {
  var plugin = {};
  plugin.id = PLUGIN_ID;
  plugin.name = PLUGIN_NAME;
  plugin.description = 'Plugin to convert signalk data to ISO 19848';


  plugin.start = function(options, restartPlugin) {
    app.setProviderStatus("Initializing");
    plugin.options = options;
    app.debug('Plugin started');

  };

  // called when the plugin is stopped or encounters an error
  plugin.stop = function() {
    app.debug('Plugin stopped');
    app.setProviderStatus('Stopped');
  };
  plugin.signalKApiRoutes = function(router) {
    const isoHandler = function(req, res, next) {
      res.type('text/xml');
      updateDataChannelList(plugin)
      let dataChannelList = createTabularDataChannelList(plugin.dataChannelList.availablePaths, plugin.dataChannelList)
      let dataset = createDataSets(plugin.dataChannelList.availablePaths, plugin.dataChannelList)
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi')

          },
          TimeSeriesData: {
            TabularData: {
              NumberOfDataSet: 2,
              NumberOfDataChannel: dataChannelList.length,
              DataChannelID: dataChannelList,
              DataSet: dataset
            }

          }
        }
      }
      res.send(builder.buildObject(data) + '\n');
    };
    const channelListHandler = function(req, res, next) {
      res.type('text/xml');
      updateDataChannelList(plugin)
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi'),
            DataChannelListID: {
              ID: 'signalk/v1/api/iso19848/datachannelist.xml',
              TimeStamp: stripMiliSeconds(plugin.dataChannelList.timeStamp)
            },
            Author: PLUGIN_ID

          },
          DataChannelList: {
            DataChannel: plugin.dataChannelList.availablePaths.map(createDataChannel)
          }
        }
      }
      res.send(builder.buildObject(data) + '\n')

    }
    router.get('/iso19848/datachannelist.xml', channelListHandler);
    router.get('/iso19848/*', isoHandler);
    router.get('/iso19848', isoHandler);


    return router;
  };

  function stripMiliSeconds(date) {
    return date.toISOString().split('.')[0] + "Z"
  }

  function createDataSets(paths, dataChannelList) {
    let dataset = {}
    paths.forEach((path, index) => {
      let data = app.getSelfPath(path)
      let value = data.value
      let time = data.timestamp
      if (!time) {
        time = new Date(0).toISOString()
      }
      let timestamp = stripMiliSeconds(new Date(time))
      if (!dataset[timestamp]) {
        dataset[timestamp] = new Array(paths.length)
      }
      dataset[timestamp][getShortID(path, dataChannelList)] = value
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
    for (var i = res.length - 1; i >= 0; i--) {
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

  function createTabularDataChannelList(paths, dataChannelList) {
    return paths.map((path, index) => {
      return createTabularDataChannel(getShortID(path, dataChannelList), index)
    })
  }

  function createTabularDataChannel(shortID, index) {
    return {
      $: {
        id: index
      },
      _: shortID
    }
  }

  function getShortID(path, dataChannelList) {
    return dataChannelList.availablePaths.indexOf(path);
  }

  function getPath(shortID, dataChannelList) {
    return dataChannelList.availablePaths[shortID];
  }

  function updateDataChannelList(plugin) {
    let temp = createDataChannelList()
    if (!plugin.dataChannelList) {
      plugin.dataChannelList = temp
      app.debug('creating new list')
    } else if (!dataChannelListIsEqual(plugin.dataChannelList, temp)) {
      plugin.dataChannelList = temp
      app.debug('updating list')
    }
  }


  function dataChannelListIsEqual(l1, l2) {
    return _.isEqual(l1.availablePaths, l2.availablePaths)
  }

  function createDataChannelList() {
    let paths = app.streambundle.getAvailablePaths().filter(path => app.getSelfPath(path) && path.split('.')[0] != 'notifications')
    let time = new Date()
    return {
      availablePaths: paths,
      timeStamp: time
    }
  }

  function createDataChannel(path, shortID) {
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

  // The plugin configuration
  plugin.schema = {

  };

  return plugin;
};