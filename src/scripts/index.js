import 'leaflet-css';
import '../styles/index.scss';
import { map, geoJson, Icon, marker, circle, layerGroup, control } from 'leaflet';
import { basemapLayer} from 'esri-leaflet';

//image fixes for webpack

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

//jquery
const $ = require('jquery');

///////////////////
////// SET UP /////
//// THE MAP //////
///////////////////

//instantiate the map
const ourMap = map('map');


///////////////////
////// LOAD ///////
//// THE DATA /////
///////////////////

const layers = ['park', 'poi', 'trails']
var allLayers = layerGroup().addTo(ourMap);
var overlays = {};
var test = [];
var counter = 1;
var last = layers.length;

$.each(layers, function (i, item) {

	let URL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`
	
	let data = getData(URL);

	data.then((result)=>{

    ///////////////////
    //// ADD DATA /////
    /// TO THE MAP ////
    ///////////////////

		let geoJsonLayer = geoJson(result);
    geoJsonLayer.addTo(allLayers);
    test.push(geoJsonLayer)

    overlays[item] = geoJsonLayer;

    if(counter == last){
      control.layers({}, overlays).addTo(ourMap);
    }
    counter +=1;
	});
});




async function getData(url) {
  let result;
  try {
    result = await $.ajax({
      url: url,
      type: 'GET'
    });
    return result;
  } 
  catch (error) {
    console.error('my request errored', error);
  }
}


///////////////////
//// POSITION /////
//// THE MAP //////
///////////////////

//map view centered on reeds lake
ourMap.setView([42.9563, -85.609], 16);

//map view centered on user
// ourMap.locate({setView: true, maxZoom: 16});

//force map to load correctly
setTimeout(function(){ ourMap.invalidateSize();}, 100);

//add basemap
basemapLayer('Gray').addTo(ourMap);

//add marker when location is found
function onLocationFound(e) {
  var radius = e.accuracy / 2;

  marker(e.latlng).addTo(ourMap)
    .bindPopup("You are within " + radius + " meters from this point").openPopup();

    circle(e.latlng, radius).addTo(ourMap);
}

//provide error when location is not found
function onLocationError(e) {
  alert(e.message);
}

//location listeners
ourMap.on('locationerror', onLocationError);
ourMap.on('locationfound', onLocationFound);

