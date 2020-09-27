/*
 * Copyright 2019 Ilker Temir <ilker@ilkertemir.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const POLL_INTERVAL = 10      // Poll every N seconds
const API_BASE = 'https://stations.windy.com./pws/update/';

const request = require('request')

module.exports = function(app) {
  var plugin = {};
  var unsubscribes = [];
  var submitProcess;
  var name = app.getSelfPath('name');

  var position;
  var windSpeed;
  var windDirection;
  var waterTemperature;
  var temperature;
  var pressure;
  var humidity;

  plugin.id = "signalk-windy";
  plugin.name = "SignalK Windy.com";
  plugin.description = "Windy.com plugin for Signal K";

  plugin.schema = {
    type: 'object',
    required: ['apiKey', 'submitInterval', 'stationId'],
    properties: {
      apiKey: {
        type: 'string',
        title: 'API Key (obtain from stations.windy.com)'
      },
      submitInterval: {
        type: 'number',
        title: 'Submit Interval (minutes)',
        default: 5
      },
      stationId: {
        type: 'number',
        title: 'Windy.com Station ID',
        default: 100 
      },
      provider: {
        type: 'string',
        title: 'Provider',
        default: ''
      },
      url: {
        type: 'string',
        title: 'Web Site',
        default: ''
      }
    }
  }

  plugin.start = function(options) {
    if (!options.apiKey) {
      app.error('API Key is required');
      return
    } 

    let subscription = {
      context: 'vessels.self',
      subscribe: [{
        path: 'navigation.position',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.wind.directionTrue',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.wind.speedTrue',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.water.temperature',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.outside.temperature',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.outside.pressure',
        period: POLL_INTERVAL * 1000
      }, {
        path: 'environment.outside.humidity',
        period: POLL_INTERVAL * 1000
      }]
    };

    app.subscriptionmanager.subscribe(subscription, unsubscribes, function() {
      app.error('Subscription error');
    }, data => processDelta(data));

    submitProcess = setInterval( function() {
      if ( (position == null) || (windSpeed == null) || (windDirection == null) ||
           (temperature == null) ) {
        return
      }
      let data = {
        stations: [
          { station: options.stationId,
            name: name,
            shareOption: 'Open',
            type: 'Signal K Windy Plugin',
            provider: options.provider,
            url: options.url,
            lat: position.latitude,
            lon: position.longitude,
            elevation: 1 }
        ],
        observations: [
          { station: options.stationId,
            temp: temperature,
            wind: windSpeed,
            winddir: windDirection,
            pressure: pressure,
            rh: humidity }
        ]
      }
    
      let httpOptions = {
        uri: API_BASE + options.apiKey,
        method: 'POST',
        json: data
      };

      request(httpOptions, function (error, response, body) {
        if (!error || response.statusCode == 200) {
          position = null;
          windSpeed = null;
          windDirection = null;
          waterTemperature = null;
          temperature = null;
          pressure = null;
          humidity = null;
        } else {
          app.error("Error submitting to Windy.com API");
          //app.error(body); 
        }
      }); 
    }, options.submitInterval * 60 * 1000);
  }

  plugin.stop =  function() {
    clearInterval(submitProcess);
  };

  function radiantToDegrees(rad) {
    return rad * 57.2958;
  }

  function kelvinToCelsius(deg) {
    return deg - 273.15;
  }

  function processDelta(data) {
    let dict = data.updates[0].values[0];
    let path = dict.path;
    let value = dict.value;

    switch (path) {
      case 'navigation.position':
        position = value;
        break;
      case 'environment.wind.speedTrue':
        windSpeed = value.toFixed(2);
        windSpeed = parseFloat(windSpeed);
        break;
      case 'environment.wind.directionTrue':
        windDirection = radiantToDegrees(value);
        windDirection = Math.round(windDirection);
        break;
      case 'environment.water.temperature':
        waterTemperature = kelvinToCelsius(value);
        waterTemperature = waterTemperature.toFixed(1);
        waterTemperature = parseFloat(waterTemperature);
        break;
      case 'environment.outside.temperature':
        temperature = kelvinToCelsius(value);
        temperature = temperature.toFixed(1);
        temperature = parseFloat(temperature);
        break;
      case 'environment.outside.pressure':
        pressure = parseFloat(value);
        break;
      case 'environment.outside.humidity':
        humidity = parseFloat(value);
        break;
      default:
        app.error('Unknown path: ' + path);
    }
  }

  return plugin;
}
