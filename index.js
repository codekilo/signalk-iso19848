const PLUGIN_ID = 'signalk-iso19848';
const PLUGIN_NAME = 'SignalK ISO 19848';
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

  // The plugin configuration
  plugin.schema = {
    
  };

  return plugin;
};
