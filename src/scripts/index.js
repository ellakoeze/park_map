import '../styles/index.scss';
import 'leaflet-css';
import { map, Util, geoJson } from 'leaflet';
import { basemapLayer} from 'esri-leaflet';

const $ = require('jquery');

const ourMap = map('map').setView([42.9411, -85.6100], 11);

basemapLayer('Gray').addTo(ourMap);

var owsrootUrl = 'https://localhost:8080/geoserver/ows';

var defaultParameters = {
    service : 'WFS',
    version : '2.0',
    request : 'GetFeature',
    typeName : 'cite:park',
    outputFormat : 'text/javascript',
    format_options : 'callback:getJson',
    SrsName : 'EPSG:4326'
};

var parameters = Util.extend(defaultParameters);
console.log(parameters);
var fakeurl = owsrootUrl + Util.getParamString(parameters);
console.log(fakeurl);

var URL = 'http://localhost:8080/geoserver/cite/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=cite%3Apark&maxFeatures=50&outputFormat=text/javascript&format_options=callback%3AgetJson'

var WFSLayer = null;
var ajax = $.ajax({
    url : URL,
    dataType : 'jsonp',
    jsonpCallback : 'getJson',
    success : (response) =>{
    	console.log('did this work', response);
        WFSLayer = geoJson(response, {
            // style: function (feature) {
            //     return {
            //         stroke: false,
            //         fillColor: 'FFFFFF',
            //         fillOpacity: 0
            //     };
            // },
            // onEachFeature: function (feature, layer) {
            //     popupOptions = {maxWidth: 200};
            //     layer.bindPopup("Popup text, access attributes with feature.properties.ATTRIBUTE_NAME"
            //         ,popupOptions);
            // }
        }).addTo(ourMap);
    }
});


