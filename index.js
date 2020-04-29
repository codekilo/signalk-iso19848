const PLUGIN_ID = 'signalk-iso19848';
const PLUGIN_NAME = 'SignalK ISO 19848';
const xml2js = require('xml2js');
var builder = new xml2js.Builder();
const DataChannelList = require('./lib/DataChannelList.js')
const util = require('./lib/util.js')
module.exports = function(app) {
  var plugin = {};
  plugin.id = PLUGIN_ID;
  plugin.name = PLUGIN_NAME;
  plugin.description = 'Plugin to convert signalk data to ISO 19848';
  plugin.dataChannelList = new DataChannelList(app)

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
      plugin.dataChannelList.update()
      let dataChannelList = createTabularDataChannelList(plugin.dataChannelList.getPaths(), plugin.dataChannelList)
      let dataset = createDataSets(plugin.dataChannelList.availablePaths, plugin.dataChannelList)
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi')

          },
          TimeSeriesData: {
            TabularData: {
              NumberOfDataSet: dataset.length,
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
      plugin.dataChannelList.update()
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi'),
            DataChannelListID: {
              ID: 'signalk/v1/api/iso19848/datachannelist.xml',
              TimeStamp: util.stripMiliSeconds(plugin.dataChannelList.time)
            },
            Author: PLUGIN_ID

          },
          DataChannelList: {
            DataChannel: plugin.dataChannelList.getDataChannelList()
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


  function createDataSets(paths, dataChannelList) {
    let dataset = {}
    paths.forEach((path, index) => {
      let data = app.getSelfPath(path.path)
      let value = data.value
      let time = data.timestamp
      if (!time) {
        time = new Date(0).toISOString()
      }
      let timestamp = util.stripMiliSeconds(new Date(time))
      if (!dataset[timestamp]) {
        dataset[timestamp] = new Array(paths.length)
      }
      dataset[timestamp][path.shortID] = value
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

  function createTabularDataChannelList(paths, dataChannelList) {
    return paths.map((path, index) => {
      return createTabularDataChannel(dataChannelList.getShortID(path), index)
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



  // The plugin configuration
  plugin.schema = {

  };

  return plugin;
};