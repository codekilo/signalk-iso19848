const PLUGIN_ID = 'signalk-iso19848';
const PLUGIN_NAME = 'SignalK ISO 19848';
const xml2js = require('xml2js');
var builder = new xml2js.Builder();
const DataChannelList = require('./lib/DataChannelList.js')
const util = require('./lib/util.js')
const isoDataChannelList = require('./lib/iso19848/DataChannelList.js')
const isoTimeSeries = require('./lib/iso19848/TimeSeries.js')
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
      let dataset = getData(plugin.dataChannelList.getPaths())
      let mmsi = app.getSelfPath('mmsi')
      let data = isoTimeSeries.create(mmsi, plugin.dataChannelList.getPaths(), plugin.dataChannelList, dataset)
      res.send(builder.buildObject(data) + '\n');
    };
    const channelListHandler = function(req, res, next) {
      res.type('text/xml');
      plugin.dataChannelList.update()
      let mmsi = app.getSelfPath('mmsi')
      let data = isoDataChannelList.create(mmsi, plugin.dataChannelList, PLUGIN_ID)
      res.send(builder.buildObject(data) + '\n')

    }
    router.get('/iso19848/datachannelist.xml', channelListHandler);
    router.get('/iso19848/*', isoHandler);
    router.get('/iso19848', isoHandler);


    return router;
  };


  function getData(paths) {
    return paths.map(path => {
      let data = app.getSelfPath(path)
      let value = data.value
      let time = data.timestamp
      if (!time) {
        time = new Date(0).toISOString()
      }
      return {
        path: path,
        value: value,
        timestamp: time
      }
    })
  }



  // The plugin configuration
  plugin.schema = {

  };

  return plugin;
};