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
var userLocation = null;
var radius = 1500000;
var locationCount = 1;

//map view centered on reeds lake
ourMap.setView([42.9563, -85.609], 16);

//turn location on
ourMap.locate({watch: true});

//force map to load correctly
setTimeout(function(){ ourMap.invalidateSize();}, 100);

//add basemap
basemapLayer('Gray').addTo(ourMap);

//location listeners
ourMap.on('locationerror', onLocationError);
ourMap.on('locationfound', onLocationFound);


///////////////////
////// LOAD ///////
//// THE DATA /////
///////////////////

const layers = ['park','trails','poi']
var allLayers = layerGroup().addTo(ourMap);
var theControl;
var overlays = {};
var ids = {};
var counter = 1;
var last = layers.length;

function init(){

  $.each(layers, function (i, item) {
  
  	let URL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`
  	
  	let data = getData(URL);
  
  	data.then((result)=>{

  
  		var geoJsonLayer;

      if (userLocation && result.features[0].geometry.type == 'Point'){
        geoJsonLayer = geoJson(result, {filter: distanceCheck}).addTo(allLayers);
      }
      else{
        geoJsonLayer = geoJson(result);
      }
      geoJsonLayer.addTo(allLayers);
      overlays[item] = geoJsonLayer;
      ids[item] = geoJsonLayer._leaflet_id;
  
      if(counter == last){
        theControl = control.layers({}, overlays).addTo(ourMap);
      }
      counter +=1;
  	});
  });
}

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

function update(){

  ///this is untested code supposed to run when location moves. probably will bork something up

  $.each(layers, function (i, item) {

    if(item == 'poi'){

      ourMap.removeLayer(allLayers.getLayer(ids[item]));
  
      let URL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`
      
      let data = getData(URL);
  
      data.then((result)=>{
        let geoJsonLayer = geoJson(result);
        ids[item] = geoJsonLayer._leaflet_id;
  
        if (userLocation && result.features[0].geometry.type == 'Point'){
          geoJson(result, {filter: distanceCheck}).addTo(allLayers);
        }

      });
    }
  });
}


function onLocationFound(e) {
  userLocation = e;
  marker(e.latlng).addTo(ourMap);
  if (locationCount>1){
    update();
  }
}

//provide error when location is not found
function onLocationError(e) {
  alert(e.message);
}

function distance(lat1, lon1, lat2, lon2, unit) {

  //something wonky happening between the map distance and the distance calculated here... im not going to worry about it
  var radlat1 = Math.PI * lat1/180
  var radlat2 = Math.PI * lat2/180
  var theta = lon1-lon2
  var radtheta = Math.PI * theta/180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist)
  dist = dist * 180/Math.PI
  dist = dist * 60 * 1.1515
  if (unit=="K") { dist = dist * 1.609344 }
  if (unit=="N") { dist = dist * 0.8684 }
  return dist
}

function distanceCheck(feature){

  let distanceCheck = distance(userLocation.latitude, userLocation.longitude, feature.geometry.coordinates[0], feature.geometry.coordinates[1], 'K')*1000;

  console.log(distanceCheck, radius);
  if(distanceCheck<= radius){
    return true;
  }
  else{
    return false;
  }

}


init();
