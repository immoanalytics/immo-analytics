// Slider for rooms
$('#room-slider').slider({
  orientation: 'horizontal',
  min: 1, // minimum room number
  max: 8, // maximum room number
  step: 1,
  range:       true,
  values:      [1,8], // default values 
  slide: function(event, ui) {
        $("#room-slider-result").html(ui.values[0] + ' - ' + ui.values[1]);
		$('#room-slider').attr('val1', ui.values[0]);
		$('#room-slider').attr('val2', ui.values[1]);
		// this function is for delay between
		timer(1000);
  }
});



// Slider for square meters

$('#meter-slider').slider({
  orientation: 'horizontal',
  min: 50, // minimum square meters
  max: 400, // maximum square meters
  step: 20,
  range:       true,
  values:      [50, 400], // default values
  slide: function(event, ui) {
        $("#meter-slider-result").html(ui.values[0] + ' - ' + ui.values[1]);
		$('#meter-slider').attr('val1', ui.values[0]);
		$('#meter-slider').attr('val2', ui.values[1]);
		// this function is for delay between
		// choising number of rooms and starting search
		timer(1000);
  }
});

var sliderTimer;

	
var timer = function(sec) {
	if (sliderTimer) window.clearTimeout(sliderTimer);
	sliderTimer = window.setTimeout(function() {
			$('#shadow').fadeToggle('fast', getData());
		}, sec);
}

var meterVal1 = $('#meter-slider').slider('option', 'values')[0],
	meterVal2 = $('#meter-slider').slider('option', 'values')[1],
	roomVal1 = $('#room-slider').slider('option', 'values')[0],
	roomVal2 = $('#room-slider').slider('option', 'values')[1];

function setDefaultValues(destination, attrs, val1, val2){
	destination.html(val1 + ' - ' + val2);
	attrs.attr('val1', val1);
	attrs.attr('val2', val2);
}

setDefaultValues(
	$("#room-slider-result"), 
	$('#room-slider'),
	roomVal1,
	roomVal2);

setDefaultValues(
	$("#meter-slider-result"), 
	$('#meter-slider'),
	meterVal1,
	meterVal2);



var objectForMapColoring = {},
	objectForRender = {};

var getData = function (){

	var bedObject = searchXML(g_XMLfile4);

	var count = 0;
	var minRooms = parseInt($('#room-slider').attr('val1')),
		maxRooms = parseInt($('#room-slider').attr('val2')),
		minMeters = parseInt($('#meter-slider').attr('val1')),
		maxMeters = parseInt($('#meter-slider').attr('val2'));

	for (var code in bedObject){
		var avgPrice = 0,
		avgLA = 0,
		sumOfPrices = 0,
		sumOfLivingArea = 0;
		
		for (var bedIndex = 0; bedIndex < bedObject[code].length; bedIndex ++) {
			var existingRooms = bedObject[code][bedIndex][0];
			var existingLivingArea = bedObject[code][bedIndex][1];
			if (existingRooms >= minRooms && existingRooms <= maxRooms){
				if (existingLivingArea >= minMeters && existingLivingArea <= maxMeters) {
					sumOfLivingArea += existingLivingArea;
					sumOfPrices += parseInt(bedObject[code][bedIndex][2]);
					count ++;
				}
			}
		}
		console.log(code + " : " + " sum of prices: " + sumOfPrices + ", matches: " + count)

		avgPrice = sumOfPrices / count;
		avgLA = sumOfLivingArea / count;
		if (isNaN(avgPrice)){
			objectForMapColoring[code] = 0;
			objectForRender[code] = [0, 0];
		} else {
			objectForMapColoring[code] = Math.round(avgPrice);
			objectForRender[code] = [Math.round(avgPrice), Math.round(avgLA)];
		}

		
		count = 0;

	}
	console.log(objectForMapColoring);
	mapUpdating();
}

var legend = {
	2000: '#800026',
	1800: '#BD0026',
	1400: '#E31A1C',
	1200: '#FC4E2A',
	1000: '#FD8D3C',
	700: '#FEB24C',
	400: '#FEE84C',
	0: '#868686'
	};


// here the map result colors and average prices can be changed
function getColor(d, objectForMapColoring) {
	var color = "";
	for (value in legend) {
		if (objectForMapColoring[d] >= value){
	   	   color = legend[value]
		}
	}
	return color;
}


function style(code) {
    return {
        fillColor: getColor(code, objectForMapColoring),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.5
    };
}
function mapUpdating(){
	$('#legend').html('');
	mymap.removeLayer(featureLayer);
  	featureLayer = L.geoJson(communeData);
  	mymap.addLayer(featureLayer);
	//L.geoJson(communeData,  {style: style}).addTo(mymap);
	mymap.eachLayer(function (layer) {
		if (layer.feature != undefined){
			layer.setStyle(style(layer.feature['properties']['code']));
			layer.on("mouseover", function(e) {
						info.update(layer.feature['properties']['name']);
                    });
			layer.on("click", function(e) {
				var codeSelected = layer.feature['properties']['code'];

                var replyArray = [];
                replyArray = searchXML(g_XMLfile1, codeSelected);
				//console.log("reply_g_XMLfile1=" + replyArray);

                // display charts
                var targetDiv = 'chartDivRent';
                renderLineChart1(replyArray, targetDiv, "Average Rental Price");

            	// function that displays average values
            	var updatedDiv = 'avgScores',
            	updatedArray;
            	$('#avgScores').html('');
            	for (var code in objectForRender){
            		if (code ==  layer.feature['properties']['code']){
            			updatedArray = objectForRender[code];

            		}
            	}
            	renderGrid(updatedArray, updatedDiv, true)
            });
			layer.on("mouseout", function(e) {
                // Start by reverting the style back
                layer.setStyle(style(layer.feature['properties']['code']));
                });
			
		}
	});
	// shadow hiding
	$('#shadow').fadeToggle('fast');
	// show legend
	$('#legend').show();
	for (value in legend){
		$('#legend').append('<div><div style="background-color:' + 
			legend[value] + '; width:20px; display: inline-block;">' +
			'&nbsp;</div><span style="padding-left: 5px;"> > ' + value + '</span></div>');
	}
	
}

// this is for start searching




// this is for style refreshing
$('#refreshStyle').click(function(){
	mymap.removeLayer(featureLayer);
  	featureLayer = L.geoJson(communeData);
  	mymap.addLayer(featureLayer);
	mymap.eachLayer(function (layer) {
		if (layer.feature != undefined){
			layer.setStyle(defaultStyle);
			layer.on("mouseout", function(e) {
                // Start by reverting the style back
                layer.setStyle(defaultStyle);
            });
            layer.on("click", function(e) {
            	

                // START --> display relevant information about the selected commune
                //
                var codeSelected = layer.feature['properties']['code'];
				console.log("Selected Postal Code="+codeSelected);

                var replyArray = [];
                replyArray = searchXML(g_XMLfile1, codeSelected);
				//console.log("reply_g_XMLfile1=" + replyArray);

                // display charts
                var targetDiv = 'chartDivRent';
                renderLineChart1(replyArray, targetDiv, "Average Rental Price");

				replyArray = searchXML(g_XMLfile2, codeSelected);

                targetDiv = 'avgScores';
                renderGrid(replyArray, targetDiv);
				
				// display all counts 
				//targetDiv = 'debugDiv';
				replyArray = searchXML(g_XMLfile3, codeSelected);
            });
 		}
    });
});



