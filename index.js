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
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi')

          },
          TimeSeriesData: {

          }
        }
      }
      res.send(builder.buildObject(data) + '\n')
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
              TimeStamp: plugin.dataChanneList.timeStamp.toISOString().split('.')[0] + "Z"
            },
            Author: PLUGIN_ID

          },
          DataChannelList: {
            DataChannel: plugin.dataChanneList.availablePaths.map(createDataChannel)
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

  function updateDataChannelList(plugin) {
    let temp = createDataChannelList()
    if (!plugin.dataChanneList) {
      plugin.dataChanneList = temp
      app.debug('creating new list')
    } else if (!dataChannelListIsEqual(plugin.dataChanneList, temp)) {
      plugin.dataChanneList = temp
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