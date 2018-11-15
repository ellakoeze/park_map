import 'leaflet-css';
import '../styles/index.scss';
import { map, geoJson, Icon, marker, circle, layerGroup, control, circleMarker } from 'leaflet';
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
var radius = 80000000;
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

const layers = ['park','trails','poi','treasure','service']
var allLayers = layerGroup().addTo(ourMap);
var theControl;
var overlays = {};
var ids = {};
var counter = 1;
var last = layers.length;

function init(param=null){
  if(param){
    modal2.style.display = "none";
    ourMap.removeLayer(allLayers.getLayer(ids.service));
    ourMap.removeLayer(allLayers.getLayer(ids.poi));
    ourMap.removeLayer(allLayers.getLayer(ids.treasure));
  }
  
  $.each(layers, function (i, item) {
  	let URL = param ? `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&PROPERTYNAME=name,geom,desc&cql_filter=name='${param}'&maxFeatures=50&outputFormat=application/json`:`http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`
  	let data = getData(URL);
  	data.then((result)=>{

  		var geoJsonLayer;

      if(!result.features || !result.features.length){
        return;
      }

      if (userLocation && result.features[0].geometry.type == 'Point'){
        
        geoJsonLayer = geoJson(result, {
          filter: distanceCheck, 
          style: function() {
            console.log(item);
            if (item == "poi") {
              return { color: "black" }; 
            } 
            else if (item == "treasure") {
              return { color: "orange" };
            } 
            else {
              return { color: "green" };
            }
          },
          onEachFeature: function (f, l) {
              l.bindPopup('<h4>'+f.properties.name+'</h4>');
              l.on("click", function(){

                l.openPopup();
              })
          }
        //   pointToLayer: function(feature, latlng) {
        //        return circleMarker(latlng, {
        //          radius: 10,
        //        });
        // }
        });
      }
      else{
        geoJsonLayer = geoJson(result);
        let style;
        if(item=='park'){
          style = {
            color: "#f0f",
            fillOpacity:0.05
          };
        }
        else{
          style = {
            color: "brown",
          };

        }
        geoJsonLayer.setStyle(style);
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

  $.each(layers, function (i, item) {

    if(item == 'poi' || item == 'secret' || item=='service'){

      ourMap.removeLayer(allLayers.getLayer(ids[item]));
  
      let URL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`;
      let data = getData(URL);

      data.then((result)=>{

        let geoJsonLayer = geoJson(result);
        ids[item] = geoJsonLayer._leaflet_id;
  
        if (userLocation && result.features[0].geometry.type == 'Point'){
          geoJsonLayer = geoJson(result, {
            filter: distanceCheck, 
            style: function() {
              if (item == "poi") {
                return { color: "black" }; 
              } 
              else if (item == "treasure") {
                return { color: "orange" };
              } 
              else {
                return { color: "green" };
              }
            },
            onEachFeature: function (f, l) {
                l.bindPopup('<h4>'+f.properties.name+'</h4>');
            }
          //   pointToLayer: function(feature, latlng) {
          //        return circleMarker(latlng, {
          //          radius: 10,
          //        });
          // }
          }).addTo(allLayers);
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

  if(distanceCheck<= radius){
    return true;
  }
  else{
    return false;
  }

}


var newMark = null;

var popupContent;

// Get the modal
var modal = document.getElementById('myModal');
var modal2 = document.getElementById('modalTwo');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var span2 = document.getElementsByClassName("close")[1];
var submitButton = document.getElementById('submitButton');
var queryButton = document.getElementById('queryButton');
var askButton = document.getElementById('askButton');
var newType;

ourMap.on('click touchstart', function(e){
    newMark = new marker(e.latlng).addTo(ourMap);
    

    modal.style.display = "block";
    submitButton.addEventListener("click", getInfo);


});

queryButton.onclick = function() {
    modal2.style.display = "block";
    let query = document.getElementById("find");
    var val;
    query.addEventListener("change", function(){
      val = this.value;
    })
    askButton.addEventListener("click", function(){init(val);});
}


// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
    removeButton();
}

span2.onclick = function() {
    modal2.style.display = "none";
    removeButton();
}


// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal || event.target == modal2) {
        modal.style.display = "none";
        modal2.style.display = "none";
        removeButton();
    }
}






function removeButton(){
  if(newMark){
    ourMap.removeLayer(newMark);
  }
};

function getInfo(){
  modal.style.display = "none";
  ///make a form do something for user input here
  let radios = document.getElementsByClassName('radio');

  for (var i = 0, length = radios.length; i < length; i++)
  {
   if (radios[i].checked)
   {
    // do whatever you want with the checked radio
    newType = radios[i].value;

    // only one radio can be logically checked, don't check the rest
    break;
   }
  }

  let name = document.getElementById("name").value;
  let desc = document.getElementById("desc").value;

  popupContent = '<p>'+name+'</p> </br><p>'+desc+'</p> ';
  

  
  var postData = 
      '<wfs:Transaction service="WFS" version="1.0.0"'
      +'  xmlns:wfs="http://www.opengis.net/wfs"'
      +'  xmlns:gml="http://www.opengis.net/gml"'
      +'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      +'  xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd http://localhost:8080/geoserver/wfs/DescribeFeatureType?typename=park:'+newType+'">'
      +'  <wfs:Insert>'
      +'    <'+newType+'>'
      +'      <geom>'
      +'         <gml:Point srsDimension="2" srsName="urn:x-ogc:def:crs:EPSG:4326">\n'
     + '          <gml:coordinates decimal="." cs="," ts=" ">' + newMark._latlng.lat + ',' + newMark._latlng.lng+ '</gml:coordinates>\n'
     + '        </gml:Point>\n'
      +'      </geom>'
      +'      <desc>'+desc+'</desc>'
      +'      <name>'+name+'</name>'
      +'    </'+newType+'>'
      +'  </wfs:Insert>'
      +'</wfs:Transaction>';

  sendData(postData);
}




function sendData(data){
    //let getURL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=DescribeFeatureType&outputFormat=application/json`
    console.log(data);
    let postURL = `http://localhost:8080/geoserver/park/ows`
   //Get the data from the form & send it to the service.
  $.ajax({
    type: "POST",
    url: postURL,
    dataType: "xml",
    contentType: "text/xml",
    data: data,
    //TODO: Error handling
    success: function(xml) {  
      newMark.bindPopup(popupContent).openPopup();
      
    }
  });

   return false; //Don't submit anything
}   





init();
