$(document).ready(function () {
	var url = Config.servletURL;
	var chronontologyURL = url + "getChronOntologyGeo";
	var baseLayer = L.tileLayer(
			'http://{s}.tiles.mapbox.com/v3/isawnyu.map-knmctlkh/{z}/{x}/{y}.png', {
				maxZoom: 15,
				attribution: "Tiles &copy; <a href='http://mapbox.com/' target='_blank'>MapBox</a> | " +
						"Data &copy; <a href='http://www.openstreetmap.org/' target='_blank'>OpenStreetMap</a> and contributors, CC-BY-SA |" +
						" Tiles and Data &copy; 2013 <a href='http://www.awmc.unc.edu' target='_blank'>AWMC</a>" +
						" <a href='http://creativecommons.org/licenses/by-nc/3.0/deed.en_US' target='_blank'>CC-BY-NC 3.0</a>"
			}
	);
	// MAP OPTIONS
	var mapY = 50.009167;
	var mapX = 4.666389;
	var mapZOOM = 3;
	var markers;
	var map = new L.Map('map', {
		center: new L.LatLng(mapY, mapX),
		zoom: mapZOOM,
		layers: [baseLayer]
	});
	// ADD SCALE AND COORDINATE VIEW
	L.control.scale().addTo(map);
	L.control.mousePosition().addTo(map);
	// ADD CONTROLS
	var maptitle = L.control({position: 'bottomleft'});
	maptitle.onAdd = function (map) {
		var div = L.DomUtil.create('div', '');
		div.id = "maptitle";
		div.innerHTML = '<span>i3.chronOntologyGEO</span><br>';
		div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
		return div;
	};
	maptitle.addTo(map);
	var mapselect = L.control({position: 'topright'});
	mapselect.onAdd = function (map) {
		var div = L.DomUtil.create('div', '');
		div.id = "mapselect";
		div.innerHTML += '<span class="maplabel">uri:</span><br>';
		div.innerHTML += '<input type="text" class="mapinput" id="uri" value="http://chronontology.dainst.org/period/ptwC51Ca6L5W" /><br>';
		div.innerHTML += '<input type="image" src="../img/world.png" class="button" id="show" alt="show data" title="show data">';
		div.innerHTML += '<input type="image" src="../img/clear.png" class="button" id="clear" alt="clear map" title="clear map">';
		div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
		return div;
	};
	mapselect.addTo(map);
	// LOAD DATA AND SET MAP
	function getMarkergeoJSON() {
		map.spin(true, {top: '50%', left: '50%', lines: 15, length: 50, width: 15, radius: 50, opacity: 0.3, shadow: true});
		$.ajax({
			type: 'GET',
			url: chronontologyURL,
			data: {
				id: encodeURIComponent($("#uri").val())
			},
			error: function (jqXHR, textStatus, errorThrown) {
				map.spin(false);
				clear();
				alert(errorThrown);
			},
			success: function (geojson) {
				try {
					geojson = JSON.parse(geojson);
				} catch (e) {
				}
				map.spin(false);
				setMarker(geojson);
				$("#clear").prop('disabled', false).css('opacity', 1).css('cursor', "pointer");
				$("#copy").prop('disabled', false).css('opacity', 1).css('cursor', "pointer");
				$("#show").prop('disabled', true).css('opacity', 0.5).css('cursor', "no-drop");
			}
		});
	}
	var spatiallyPartOfRegion = {
		"color": "#ff0000",
		"weight": 5,
		"opacity": 0.65
	};
	var namedAfter = {
		"color": "#0000ff",
		"weight": 5,
		"opacity": 0.65
	};
	var hasCoreRegion = {
		"color": "#ff34b3",
		"weight": 5,
		"opacity": 0.65
	};
	var undefinedRegion = {
		"color": "#9214ff",
		"weight": 1,
		"opacity": 0.7,
		"fillOpacity": 0.7,
		"fillColor": "#9214ff"
	};
	function setMarker(geojson) {
		markers = null;
		markers = L.markerClusterGroup();
		var marker = L.geoJson(geojson, {
			onEachFeature: onEachFeature,
			style: function (feature) {
				if (feature.geometry.type != "Point") {
					if (feature.properties.relation === "spatiallyPartOfRegion") {
						return spatiallyPartOfRegion;
					} else if (feature.properties.relation === "namedAfter") {
						return namedAfter;
					} else if (feature.properties.relation === "hasCoreRegion") {
						return hasCoreRegion;
					} else if (feature.properties.relation === "undefined") {
						return undefinedRegion;
					} else {
						return spatiallyPartOfRegion;
					}
				}
			},
			pointToLayer: function (feature, latlng) {
				if (feature.properties.relation === "spatiallyPartOfRegion") {
						return L.circleMarker(latlng, {radius: 8, fillColor: "#ffffff", color: "#ff0000", weight: 5, opacity: 1, fillOpacity: 1});
					} else if (feature.properties.relation === "namedAfter") {
						return L.circleMarker(latlng, {radius: 8, fillColor: "#ffffff", color: "#0000ff", weight: 5, opacity: 1, fillOpacity: 1});
					} else if (feature.properties.relation === "hasCoreRegion") {
						return L.circleMarker(latlng, {radius: 8, fillColor: "#ffffff", color: "#ff34b3", weight: 5, opacity: 1, fillOpacity: 1});
					} else {
						return L.circleMarker(latlng, {radius: 8, fillColor: "#ffffff", color: "#ff0000", weight: 5, opacity: 1, fillOpacity: 1});
					}
			}
		});
		markers.addLayer(marker);
		map.addLayer(markers);
	}
	function onEachFeature(feature, layer) {
		var popupContent = "";
		popupContent += "<b>" + feature.properties.name + "</b><br><a href='" + feature.properties.homepage + "' target='_blank'>Website</a>";
		layer.bindPopup(popupContent);
	}
	// FUNCTIONS FOR BUTTONS
	$('#clear').click(function (e) {
		clear();
	});
	$('#show').click(function (e) {
		getMarkergeoJSON();
	});
	// GENERAL FUNCTIONS
	function clear() {
		$("#clear").prop('disabled', true).css('opacity', 0.5).css('cursor', "no-drop");
		$("#show").prop('disabled', false).css('opacity', 1).css('cursor', "pointer");
		if (markers) {
			map.removeLayer(markers);
		}
		setTimeout(function () {
			map.setView([mapY, mapX], mapZOOM);
		}, 1);
	}
	clear();
});