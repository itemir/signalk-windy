# Signal K Plugin for Windy

<img src='https://raw.githubusercontent.com/itemir/signalk-windy/master/signalk-windy-screenshot.png' align='left' width='300' hspace='25' vspace='10'>In some ways, all boats are weather stations. This plugin gathers environment data from boat instruments and sends information to Windy as a Personal Weather Station (PWS). It supports wind speed, gusts, wind direction, temperature, pressure and humidity.

See a sample station [here](https://www.windy.com/station/pws-f06d21ca?47.628,-122.391,8,i:pressure).

Important Notes:
  * Requires `navigation.position`, `environment.wind.directionGround`, `environment.wind.speedOverGround` and `environment.outside.temperature`
  * You will likely need [signalk-derived-data](https://github.com/SignalK/signalk-derived-data) plugin for `environment.wind.directionGround` and `environment.wind.speedOverGround`.
  * `environment.outside.pressure` and `environment.outside.humidity` are optional
  * You need an API key that you can obtain from [Windy](https://stations.windy.com/stations)
  * You first need to create a station on [Windy](https://github.com/itemir/signalk-magnetic-variation), enter the corresponding ID to plugin configuration
