# SignalK-iso19848
This plugin is designed to offer the data on the signalk server in a format compatible with ISO 19848

## Use

The plugin provides a few REST endpoints

### GET /signalk/v1/api/iso19848/datachannelist.xml
This is the data channel list mapping shortIDs used in the timeseries format to readable paths


### GET /signalk/v1/api/iso19848/\<path\>
This will return the current values for all signalk paths that start with the path in the URL.
All values are from the self vessel in signalk
leaving path empty will result in all paths being returned

## Development

To install the plugin for development first clone the repository and link the npm module:

```
$ git clone
$ cd signalk-iso19848
$ sudo npm link
```

Then go to the SignalK configuration directory (probably `~/.signalk`)  and link the module again:

```
$ cd .signalk 
$ npm link @codekilo/signalk-iso19848
```