import '../styles/index.scss';
import 'leaflet-css';
import { map, Util, geoJson, Icon } from 'leaflet';
import { basemapLayer} from 'esri-leaflet';

const $ = require('jquery');

const ourMap = map('map').setView([42.9411, -85.6100], 13);

basemapLayer('Gray').addTo(ourMap);

// var owsrootUrl = 'https://localhost:8080/geoserver/ows';

// var defaultParameters = {
//     service : 'WFS',
//     version : '2.0',
//     request : 'GetFeature',
//     typeName : 'cite:park',
//     outputFormat : 'text/javascript',
//     format_options : 'callback:getJson',
//     SrsName : 'EPSG:4326'
// };

// Icon.Default.imagePath = '.';
// OR
delete Icon.Default.prototype._getIconUrl;

Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const layers = ['park', 'poi', 'roads', 'trails', 'water']

$.each(layers, function (i, item) {

  console.log(i, item);
	let URL = `http://localhost:8080/geoserver/park/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=park:${item}&maxFeatures=50&outputFormat=application/json`
	
	let data = getData(URL);

	data.then((result)=>{
		geoJson(result).addTo(ourMap);
	})

});

async function getData(url) {
    let result;

    try {
        result = await $.ajax({
            url: url,
            type: 'GET'
        });

        return result;
    } catch (error) {
        console.error('my request errored', error);
    }
}


