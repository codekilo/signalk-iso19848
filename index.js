const PLUGIN_ID = 'signalk-iso19848';
const PLUGIN_NAME = 'SignalK ISO 19848';
const xml2js = require('xml2js');
var builder = new xml2js.Builder();
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
      let paths = app.streambundle.getAvailablePaths().filter(path => app.getSelfPath(path) && path.split('.')[0] != 'notifications')
      let data = {
        Package: {
          Header: {
            ShipID: app.getSelfPath('mmsi'),
            DataChannelListID: {
              ID: 'signalk/v1/api/iso19848/datachannelist.xml',
              TimeStamp: new Date().toISOString().split('.')[0] + "Z"
            },
            Author: PLUGIN_ID

          },
          DataChannelList: {
            DataChannel: paths.map(createDataChannel)
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