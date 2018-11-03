import '../styles/index.scss';

const L = require('leaflet');

const map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13
});

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZWxsYWsiLCJhIjoiY2o3NzF2NWg3MTVjeTMzbnhsMXF1bzg2ZCJ9.ynl5jTicJ4QLLE070PB-YQ'
}).addTo(map);

console.log('webpack starterkit');
console.log('can i console');







