/***************************************************************
	VARIABLES
***************************************************************/
var maxTime = 0;					//highest end time in file
var margin = 50;					//margin of SVG - it changes during change of scale
var marginX = 50;					//margin for X - doesnt change at all
var margLife = 60;					//margin for LifeGraph
var radius = 9;						//radius
var stroke = 4;						//sirka of lines
var scaler = 50;					//scale on axis
var positionLine = 0;				//position of line in axis

var cells = []; 					//array of cells, which will display (chnage when using slider)
var datacells = [];					//array for storing cell arrays during parsing the file
var cellPopulation = [];			//array of all cells from file (doesnt change at all)
var lifeGraphCells = [];			//array for storing cells for lifeGraph

//variables for info about states of cells
var begin = 0;
var mitosis = 0;
var death = 0;

//zmenit nazev!
var posunuti = 60;		//Posunuti hodnot v life graphu vedle poctu ZIJE, SMRT, MITOSA...
var branching = 0;

//nastaveni
var isVertical = false;					//is vertical display choosed?
var changeMaxTime = false;				//should i change maxTime?
var showFrom = 0;
var showTo = 0;
var everywhereAxis = false;				//should i show axis everywhere?
var smallVisualisation = false;			//should i show small visualisation?
var showLifeLengthText = true;			//should i show the text of legth of life?
var showCellId = true;					//should i show the id of cell?
var displayScale = true;
var showLine = true;

//which font size is active?
var activeFontId = 1;
var activeFontLife = 1;
var activeFontText = 1;

var linearScaleX;						//Linear scale for X axis
var linearScaleY;						//Linear scale for y axis
var graphBoxWidth = 1000;				//width of graphBox
var graphBoxHeightVertical = 890;		//Height of graph box for vertical display





var description = ["BEGIN", "END", "DIVISION", "INTERPHASE"];

//colors				 BEGIN  	END 	   MITOSIS    ALIVE  	 LINE
var colors = 			["#377eb8", "#e41a1c", "#4daf4a", "#984ea3", "#000000"];
var colorsHovering = 	["#87b1d4", "#ee7576", "#94cf92", "#c194c7", "#666666"];

var textHeight = ["12px", "14px", "16px", "18px", "20px"];

//Texts for dialog windows
var helpBasic = "To display your data, load the file via <b>Load File</b> button above. Only <i><b>.txt</b></i> format is supported, and the data itself"
				+ " have to be in defined style. <br>Which means: every line should have 4 numbers separated by space. These number are: ID, BEGIN, END and PARENT."
				+ "<br><br>After choosing the file, the app will display the <b>Graph of Cell Population</b>. More info about that in the next <b>HELP</b> button."
				+ "<br><br>You can switch the <i>vertical</i> and <i>horizontal</i> display by clicking on the appropriate buttons."
				+ "<br><br>You can also switch display of full and minimalistic graph by clicking on <b>Scale</b> button."
				+ "<br><br>By clicking on <b>ID</b>, <b>Life</b> and <b>Line</b> buttons you will show/hide descriptions or the red line in the graph."
				+ "<br><br>By clicking on <b>Font ID</b> or <b>Font Life</b> you will change the font height."
				+ "<br><br>Clicking on <b>Time</b> or <b>Sort ID</b> buttons the whole graph will sort by the time or by the ids of cells"
				+ "<br><br>Clicking on <b>Axes</b> you will switch between displaying only one main axis or axes to each cell graph."
				+ "<br><br><b>SVG</b> button will save whole graph into svg. For converting SVG to PDF use: <a href=https://cloudconvert.com/>Cloud converter</a>";

var helpGraphOfCells = "<b>The Graph of Cell Population</b> shows the lineage of all cells from the video."
						+ "<br><br><b>Blue circles</b> (BEGIN) represents the frame (time), where the cell appeared for the first time. These circles are connected "
						+ "via black line with <b>Red</b> (END) or <b>Green</b> (DIVISION) circles. These represents the last time of cell in the video. If it is <b>red</b>"
						+ " it means the cell died. If it is <b>green</b> it means the cell has at least one descendant."
						+ "<br><br> Each cell has it's <b>ID</b> besides it's blue circle. Above the black line is showed the number of frames the cell was alive."
						+ "<br><br> The graph can be restricted by handlers of the <b>slider</b> in the top. By moving, the graph will check if the BEGIN frame"
						+ " of the cell belongs to the chosen selection. If not, the graph will adapt and remove all unapropriate cells. By moving handlers back, "
						+ "the hidden cells will show up again (after \"dropping\" the handler)."
						+ "<br><br>By clickinkg on the elements in the graph, the info about that elements and the cells will show up on the right."
						+ "<br><br>There is also the axis with red line. Values represents the frames (time) and the red line the specific frame (time) in the video."
						+ "By clicking on the axis, the line will change it's position to the chosen frame. Also the additional information about things that occured "
						+ "in that frame - <b>The Graph of States</b> and <b>Graph of Life</b> - will show up on the right. More info about these graphs in next HELP button."
						+ "<br>You can change the position of the red line also by pressing the <i>left</i> and <i>right</i> arrow keys.";

var helpGraphOfStates = "<b>The Graph of States</b> and <b>Graph of Life</b> shows additional information about cells in certain frame."
						+ "<br><br><b>The Graph of States</b> shows what happened in the time specified by the red line. It will provide information about"
						+ "number of cells which BEGAN in the given frame, number of cells which END, number of DIVISIONS and also number of currently LIVING cells."
						+ "These cells are than represented in the Graph of Life."
						+ "<br><br><b>The Graph of Life</b> shows the minimalistic line of life of currently living cells. Each line belongs to the one cell, which ID is shown"
						+ "on the left side of the black line. Next to the both ends are the frame numbers of BEGIN and END frame of the cell.";

var interestingInfoText = "<br><b>Actual frame: </b>";

disableAllButtons(true);

function disableAllButtons(value){
	document.getElementById("horizontal").disabled = value;
	document.getElementById("vertical").disabled = value;
	document.getElementById("axisEverywhere").disabled = value;
	document.getElementById("idShow").disabled = value;
	document.getElementById("lifeText").disabled = value;
	document.getElementById("redLine").disabled = value;
	document.getElementById("fontID").disabled = value;
	document.getElementById("changeLife").disabled = value;
	document.getElementById("changeScale").disabled = value;
	document.getElementById("timeSort").disabled = value;
	document.getElementById("idSort").disabled = value;
	document.getElementById("svgSaver").disabled = value;
}

function disableSVGAxis(){
	$(".axisSVG").toggle();
}

//preparing jquery
$( document ).ready(function() {
    console.log( "jquery ready!" );
});

$('#file-input').inputFileText({
    text: 'Load File'}
);

function showWarningDialog(){

	$( "#warningDialog" ).dialog({
      resizable: false,
      width:500,
      height:230,
      modal: true,
      buttons: {
        "Close": function() {
          $( this ).dialog( "close" );
        }
      }
    });
}

function showDivisionDialog(){

	$( "#divisionDialog" ).dialog({
      resizable: false,
      width:500,
      height:250,
      modal: true,
      buttons: {
        "Close": function() {
          $( this ).dialog( "close" );
        }
      }
    });
}

$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
			if(isVertical){
				lineY(positionLine -= 1);
			} else{
				lineX(positionLine -= 1);
			}
        break;
        case 39: // right
			if(isVertical){
				lineY(positionLine += 1);
			} else{
				lineX(positionLine += 1);
			}
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

 $( "#dialog" ).dialog({
    autoOpen: false,
    width:800,
    height:700,
    show: {
        effect: "blind",
        duration: 500
    },
    hide: {
        effect: "blind",
        duration: 500
    }
});



$( "#helpBasic" ).click(function() {
   	document.getElementById("helpText").innerHTML = helpBasic;
    $( "#dialog" ).dialog( "open" );
});
$( "#helpGraphOfCells" ).click(function() {
   	document.getElementById("helpText").innerHTML = helpGraphOfCells;
    $( "#dialog" ).dialog( "open" );
});
$( "#helpGraphOfStates" ).click(function() {
   	document.getElementById("helpText").innerHTML = helpGraphOfStates;
    $( "#dialog" ).dialog( "open" );
});



/**************************************************************
	LOAD DATA
***************************************************************/
//reaction on file upload
document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

//Load data from input
function readSingleFile(e) {
  	var file = e.target.files[0];
  	var fileName = file.name;
  	if (!file) {
    	return;
  	}

  	if(checkFileName(fileName) != 0){
  		document.getElementById("p1").innerHTML = "Not supported format - file is not <b>.txt</b>!";
  		showWarningDialog();
  		throw new Error("Not supported format - File is not .txt!");
  		return;
  	}

  	var reader = new FileReader();
  	reader.onload = function(e) {
  		var contents = e.target.result;
  		parseData(contents);
  		changeMaxTime = true;
  		showFrom = 0;
  		showTo = maxTime;
  		cellPopulation = $.map(cells, function (obj) {
                      return $.extend(true, {}, obj);
                  });
  		display();
  		sliderManager();
  		document.getElementById("cellInfo").innerHTML = "";
  		disableAllButtons(false);

		branching = highestNumberOfChildren(cellPopulation);
		if(branching > 5){
			document.getElementById("p2").innerHTML = "Abnormal division is higher than 5! Visualisation may look weird... <br>The highest divison: " + branching;
  			showDivisionDialog();
		}
	};

  reader.readAsText(file);
}


//Function will change the cell selection for display bassed on slider
//@param	population 		array of cells, from which the functoin will do the selection
function adjustPopulationSelection(population){
	var i = 0

	//cycle checks if the first "root" cell is in the restriction time from slider
	//YES: 		check if its children are in the restriction and store this "root" cell in cells
	//NO: 		if cell has children, call this function with array of children
	for(i; i < population.length; i++){
		if((population[i].begin >= showFrom && population[i].begin <= showTo) || (population[i].end >= showFrom && population[i].end <= showTo)){
			adjustChildren(population[i]);
			cells.push(population[i]);
		} else{
			if(population[i].children.length != 0){
				adjustPopulationSelection(population[i].children);
			}
		}
	}
}


//Function will check if the children of the cell are in the restriction time from slider, if not, they are removed from the list of children
//@param	cell 		cell which the function will check
function adjustChildren(cell){
	if(cell.children.length != 0){
		var k = cell.children.length - 1;
		for(k; k >= 0; k--){
			if(!(cell.children[k].begin <= showTo)){
				cell.children.splice(k, 1);
			} else{
				adjustChildren(cell.children[k]);
			}
		}
	}
}

//Function will check, if the file is .txt format
function checkFileName(name){
	var length = name.length;
	var i = length - 4;
	var str1 = name.substring(i, length);
	var str2 = ".txt";
	return str1.localeCompare(str2);
}

//Function will take string array (=input file), and store all "root" cells with its children (and children of its children...)
//to "cells" array of cell objects
//@param 	text 	string array of whole .txt file
function parseData(text){
	var tmpPole = [];												//temporary array for storing all 4 numbers of cell (id, begin, end, parent)
	var tmpPromenna = "";											//temporary string for storing nummbers
	var i = 0;
	var z = 0;
	index = 0;														//variable for storing information about parent

	if(changeMaxTime){
		maxTime = 0;
		positionLine = 0;
		changeMaxTime = false;
	}

	while(datacells.length > 0){
		datacells.pop();
	}

	while(cells.length > 0){
		cells.pop();
	}

	//cycle will store each cell from text string into "tmpPole" as array with 4 values: [id,begin,end,parent]
	for(i; i < text.length; i++){

		if(text[i] == "\n"){										//is end of line?
			if(isNaN(+tmpPromenna)){
				document.getElementById("p1").innerHTML = "Not supported data! In line " + (datacells.length + 1) + " there are not only numbers!";
				showWarningDialog();
				throw new Error("Not supported data! - in row " + (datacells.length + 1) + " there are not only numbers!");
			}
			tmpPole.push(+tmpPromenna);								//store the last value int array

			if((tmpPole.length < 4) || (tmpPole.length > 4)){		//were there 4 values in the line
				document.getElementById("p1").innerHTML = "Not supported data! In line " + (datacells.length) + " there are more or less than 4 numbers!";
				showWarningDialog();
				throw new Error("Not supported data! - in row " + (datacells.length) + " there are more or less than 4 numbers!");
			}

			datacells.push(tmpPole);								//array is stored into "datacells"
			tmpPole = [];
			tmpPromenna ="";
		}

		else if(text[i] != " "){									//if it is not the break
			tmpPromenna += text[i]; 								//its digit of value -> storing to tmpPromenna
		}

		else{														//it is the break
			//if the last value is not the number (its char or something else) -> it is not supported file!
			if(isNaN(+tmpPromenna)){
				document.getElementById("p1").innerHTML = "Not supported data! In line " + (datacells.length + 1) + " there are not only numbers!";
				showWarningDialog();
				throw new Error("Not supported data! - in row " + (datacells.length + 1) + " there are not only numbers!");
			}
			tmpPole.push(+tmpPromenna);								//the number is stored into tmpPole
			tmpPromenna = "";
		}
	}

	//cycle will go through all cells in "datacells" array and create an array of "root" cells,
	//which will have all its children (and children of its children...) stored inside its own array
	for(z; z < datacells.length; z++){
		tmpPole = datacells[z];
		var parent;													//who's the parent

		//creating the new object of cell: ID, BEGIN TIME, END TIME, PARENT ID, ARRAY OF CHILDREN
		var cell = {
			id: tmpPole[0],
			begin: tmpPole[1],
			end: tmpPole[2],
			parentID: tmpPole[3],
			children: []
		}

		if(maxTime < cell.end){										//change the maxTime if the end time of cell is higher
			maxTime = cell.end;
		}


		if(cell.parentID == 0){										//cell doesnt have parent ->
			cells.push(cell);										//its the "root" cell! -> store it into cells (should be into cellPopulation, but i will create copy of it later)
		}
		else{														//cell has parent ->
			findParent(cell.parentID, cell, cells);					//it will be stored into children array of its parent
		}
	}
}

//Function will find the parent of the cell and store it inside its children array
//@param 	parentID	id of parent
//@param	cell 		cell which i want to store
//@param 	celles 		array of cells, where I look for parent

function findParent(parentID, cell, celles){
	var j = 0;
	for(j; j < celles.length; j++){
		if(celles[j].id == parentID){							//I found the parent!
			celles[j].children.push(cell);						//store the cell into parent children array
			break;
		}
		else if(celles[j].children != null){					//it is not the parent but it has children
			findParent(parentID, cell, celles[j].children);		//try find the parent there!
		}
	}
}

/**************************************************************
   SLIDER CHANGES
***************************************************************/
//Function will remove cells array
function removeCells(){
	while(cells.length > 0){
		cells.pop();
	}
}


/**************************************************************
   BUTTONS
***************************************************************/
function changeFontId(){
	if(activeFontId < 4){
		activeFontId += 1;
	} else{
		activeFontId = 0;
	}
	display();
}

function changeFontLife(){
	if(activeFontLife < 4){
		activeFontLife += 1;
	} else{
		activeFontLife = 0;
	}
	display();
}

function changeFontText(){
	if(activeFontText < 2){
		activeFontText += 1;
	} else{
		activeFontText = 0;
	}
}



function makeSVG(){
	if(!everywhereAxis){
		disableSVGAxis();
	}
	var svg = document.getElementById("graphBoxSVG");
	var serializer = new XMLSerializer();
	var source = serializer.serializeToString(svg);
	if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
    	source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	}
	if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
    	source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
	}
	source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
	var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

	var saver = document.getElementById("downloadLink").href = url;
	if(!everywhereAxis){
		disableSVGAxis();
	}
}

$("#idShow").click(function(){
        $(".idOfCell").toggle(400);
        showCellId = !showCellId;
        setTimeout(function() {makeSVG();  }, 500);

});

$("#lifeText").click(function(){
        $(".lengthOfLifeText").toggle(400);
        showLifeLengthText = !showLifeLengthText;
        setTimeout(function() {makeSVG();  }, 500);
});

$("#redLine").click(function(){
        $(".movingLine").toggle(400);
        showLine = !showLine;
        setTimeout(function() {makeSVG();  }, 500);
});

$("#axisEverywhere").click(function(){
        axisEverywhere();
});

$("#vertical").click(function(){
        vertical();
});

$("#horizontal").click(function(){
        horizontal();
});

$("#fontID").click(function(){
        changeFontId();
});

$("#changeLife").click(function(){
        changeFontLife();
});

$("#changeScale").click(function(){
        changeScales();
});

$("#timeSort").click(function(){
        sortByTime();
});

$("#idSort").click(function(){
        sortById();
});

function vertical(){
	isVertical = true;
	display();
}

function horizontal(){
	isVertical = false;
	display();
}

function axisEverywhere(){
	everywhereAxis = !everywhereAxis;
	display();
}

function changeScales(){
	smallVisualisation = !smallVisualisation;
	if(smallVisualisation){
		scaler = 10;
		radius = 3;
		stroke = 1.5;

		margin = 10;
	}
	else{
		scaler = 50;
		radius = 9;
		stroke = 4;

		margin = 50;
	}

	if(displayScale){
		display();
	}
}

function display(){
	if(isVertical){
		displayVertical();
		makeSVG();
	} else{
		displayHorizontal();
		makeSVG();
	}
}

function sortByTime(){
	cells.sort(function(a,b){
		var keyA = a.begin;
		var keyB = b.begin;
		if(keyA < keyB) return -1;
    	if(keyA > keyB) return 1;
    	if(keyA == keyB) {
    		var keyC = a.id;
			var keyD = b.id;
			if(keyC < keyD) return -1;
    		if(keyC > keyD) return 1;
    		return 0;
    	}
	})

	display();
}

function sortById(){
	cells.sort(function(a,b){
		var keyA = a.id;
		var keyB = b.id;
		if(keyA < keyB) return -1;
    	if(keyA > keyB) return 1;
    	return 0;
	})
	display();
}

function sortByIdSmth(cells){
	cells.sort(function(a,b){
		var keyA = a.id;
		var keyB = b.id;
		if(keyA < keyB) return -1;
    	if(keyA > keyB) return 1;
    	return 0;
	})
}

function lifeText(){
	showLifeLengthText = !showLifeLengthText;
	display();
}

//Funkce, ktera vytvori Slider
function sliderManager(){
	$("#slider-range").slider({
		range: true,
		min: 0,
		max: maxTime,
		values: [0, maxTime],
		slide: function(event, ui) {
			d3.select("#textMin").text("From: " + ui.values[ 0 ]);
			d3.select("#textMax").text("To: " + ui.values[ 1 ]);
			showFrom = ui.values[ 0 ];
			showTo =  ui.values[ 1 ];

			d3.selectAll(".superCell").each(function(d, i){
				if(this.__data__[1] < showFrom || this.__data__[0] > showTo){
					d3.select(this).classed("superCell", false);
					d3.select(this).classed("hide", true);
					$(this).toggle(250);
				}
			})

			d3.selectAll(".hide").each(function(d, i){
				if(this.__data__[1] >= showFrom && this.__data__[0] <= showTo){
					d3.select(this).classed("hide", false);
					d3.select(this).classed("superCell", true);
					$(this).toggle(250);
				}
			})

		},
		stop: function(event, ui){
			removeCells();
			var cellsCopy = $.map(cellPopulation, function (obj) {
                      return $.extend(true, {}, obj);
                  });
			adjustPopulationSelection(cellsCopy);
			display();
		}
	});
	d3.select("#textMin").text("From: " + $( "#slider-range" ).slider( "values", 0 ));
	d3.select("#textMax").text("To: " + $( "#slider-range" ).slider( "values", 1 ));
}


/**************************************************************
   DDISPLAYING ELEMENTS
***************************************************************/

//Function will display the line of life between the Begin and End circle
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the line in graph
function displayBeginToEndLine(cell, cellContainer, positionInGraph){
		var childrenText = getChildrenText(cell);
		var beginToEndLine = cellContainer.append("line")
										  .classed("beginToEndLine", true)
										  .on("mouseover", function() {							//Change color on hovering
        										d3.select(this).attr("stroke", colorsHovering[4]);
      				  					  })
    				  					  .on("mouseout", function(){
    											d3.select(this).attr("stroke", colors[4]);
    				  					  })
    				  					  .on("click", function(){								//On click show info about life of cell
    											d3.select("body").select(".cellInfo").selectAll("text").remove();
    											d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    				 							.html("INTERPHASE of Cell: <b>" + cell.id + "</b><br/>BEGIN in Frame: <b>" + cell.begin + "</b><br/>END in Frame: <b>" + cell.end + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    				  					  })
    				  					  .attr("stroke-width", stroke)
                      					  .attr("stroke", colors[4]); ;

		if(isVertical){
			beginToEndLine.attr("x1", positionInGraph)
						  .attr("y1", linearScaleY(cell.begin) + marginX/2)
						  .attr("x2", positionInGraph)
						  .attr("y2", linearScaleY(cell.end) + marginX/2)
		} else{
			beginToEndLine.attr("x1", linearScaleX(cell.begin) + marginX/2)
						  .attr("y1", positionInGraph)
						  .attr("x2", linearScaleX(cell.end) + marginX/2)
						  .attr("y2", positionInGraph);
		}
}

//Function will show the lenght of life
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the text in graph
function displayLengthOfLife(cell, cellContainer, positionInGraph){
		var timeDisplay = cellContainer.append("text").classed("lengthOfLifeText", true).attr("font-family", "sans-serif").attr("font-weight", "bold")
    								   .text(function(){
    										var result = cell.end - cell.begin + 1;
    										if(result < 2 || (result < 5 && maxTime > 20)){
    											return "";
    										}
    										else{
    											return result;}
    										})
    								    .attr("font-size", textHeight[activeFontLife])
   										.attr("id", "life" + cell.id)
   										.attr("fill", colors[3]);
   		if(isVertical){
   			timeDisplay.attr("x", positionInGraph - 18 - activeFontLife)
    				   .attr("y", linearScaleY((cell.end - cell.begin)/2 + cell.begin) + marginX/2)
   		} else {
   			timeDisplay.attr("x", linearScaleX((cell.end - cell.begin)/2 + cell.begin) + marginX/2)
    				   .attr("y", positionInGraph + 15 + activeFontLife);
   		}
}

//Function will display the Begin circle
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the circle in graph
function displayBegin(cell, cellContainer, positionInGraph){
	var childrenText = getChildrenText(cell);		//list of cells in text
	var beginCircle = cellContainer.append("circle").classed("BeginCircle", true)
									.on("mouseover", function() {					//change of color on hovering
        									d3.select(this).attr("fill", colorsHovering[0]);
      								})
    								.on("mouseout", function() {
         									d3.select(this).attr("fill", colors[0]);
    								})
    								.on("click", function(){
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    													.html("BEGIN of Cell: <b>" + cell.id + "</b><br/>BEGIN in Frame: <b>" + cell.begin + "</b><br/>END in Frame: <b>" + cell.end + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    								})
    								.attr("r", radius)
			   						.attr("fill", colors[0]);

	if(isVertical){
		beginCircle.attr("cx", positionInGraph)
				   .attr("cy", linearScaleY(cell.begin)+ marginX/2);

	} else{
		beginCircle.attr("cx", linearScaleX(cell.begin) + marginX/2)
				   .attr("cy", positionInGraph);
	}
}

//Function will display the Begin circle
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the circle in graph
function displayBothBeginEnd(cell, cellContainer, positionInGraph){
	var childrenText = getChildrenText(cell);		//list of cells in text
	var outerCircle = cellContainer.append("circle").classed("BeginCircle", true)
									.on("mouseover", function() {					//change of color on hovering
        									d3.select(this).attr("fill", colorsHovering[0]);
      								})
    								.on("mouseout", function() {
         									d3.select(this).attr("fill", colors[0]);
    								})
    								.on("click", function(){
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    													.html("BEGIN and END of Cell: <b>" + cell.id + "</b><br/>BEGIN and END in Frame: <b>" + cell.begin + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    								})
    								.attr("r", function() {
    									if(smallVisualisation){
    										return radius + 2;
    									}
    									return radius + 2;
    								})
			   						.attr("fill", colors[0]);

	var innerCircle = cellContainer.append("circle").classed("BeginCircle", true)
									.on("mouseover", function() {					//change of color on hovering
        									d3.select(this).attr("fill", function(){
			   							if(cell.children.length != 0){
			   								return colorsHovering[2];
			   							}
			   							return colorsHovering[1];
			   						});
      								})
    								.on("mouseout", function() {
         									d3.select(this).attr("fill", function(){
			   							if(cell.children.length != 0){
			   								return colors[2];
			   							}
			   							return colors[1];
			   						});
    								})
    								.on("click", function(){
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    													.html("BEGIN and END of Cell: <b>" + cell.id + "</b><br/>BEGIN and END in Frame: <b>" + cell.begin + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    								})
    								.attr("r", function() {
    									if(smallVisualisation){
    										return radius;
    									}
    									return radius - 1;
    								})
			   						.attr("fill", function(){
			   							if(cell.children.length != 0){
			   								return colors[2];
			   							}
			   							return colors[1];
			   						});

	if(isVertical){
		outerCircle.attr("cx", positionInGraph)
				   .attr("cy", linearScaleY(cell.begin)+ marginX/2);

		innerCircle.attr("cx", positionInGraph)
				   .attr("cy", linearScaleY(cell.begin)+ marginX/2);


	} else{
		outerCircle.attr("cx", linearScaleX(cell.begin) + marginX/2)
				   .attr("cy", positionInGraph);

		innerCircle.attr("cx", linearScaleX(cell.begin) + marginX/2)
				   .attr("cy", positionInGraph);
	}
}


//Function will display the Id of cell
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the id
function displayIdOfCell(cell, cellContainer, positionInGraph){
	var idOfCell = cellContainer.append("text")
								.attr("class", "idOfCell")
								.text(cell.id)
			   					.attr("font-size", textHeight[activeFontId])
			   					.attr("text-anchor", "right")
			   					.attr("font-family", "sans-serif")
			   					.attr("font-weight", "bold");

	if(isVertical){
		idOfCell.attr("x", positionInGraph + 10)
			   	.attr("y", linearScaleY(cell.begin) + marginX - 7);
	} else{
		idOfCell.attr("x", linearScaleX(cell.begin) + marginX - 15)
			   	.attr("y", positionInGraph - 10);
	}
}

//Function will display the mitosis circle
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the circle
function displayMitosis(cell, cellContainer, positionInGraph){
	var childrenText = getChildrenText(cell);
	var mitosisCircle = cellContainer.append("circle")
								 	 .attr("class", "MitosisCircle")
								 	 .on("mouseover", function() {				//Zmena barvy po najeti na prvek
        								d3.select(this).attr("fill", colorsHovering[2])
      							 	 })
    							 	 .on("mouseout", function() {
         								d3.select(this).attr("fill", colors[2]);
    							 	 })
    							 	 .on("click", function(){					//Po kliknuti se zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text")
    													.attr("font-size", textHeight[activeFontText])
    													.html("DIVISION of Cell: <b>" + cell.id + "</b><br/>BEGIN in Frame: <b>" + cell.begin + "</b><br/>END in Frame: <b>" + cell.end + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>");
    							 	 })
    							 	 .attr("r", radius)
			   					 	 .attr("fill", colors[2]);

	if(isVertical){
		mitosisCircle.attr("cx", positionInGraph)
					 .attr("cy", linearScaleY(cell.end) + marginX/2);

	} else{
		mitosisCircle.attr("cx", linearScaleX(cell.end) + marginX/2)
					 .attr("cy", positionInGraph);
	}
}

//Function will display the End circle
//@param 	cell 			actual displaying cell
//@param	cellContainer	svg container of the cell
//@param	positionInGraph where to place the circle
function displayEnd(cell, cellContainer, positionInGraph){
	var childrenText = getChildrenText(cell);
	var endCircle = cellContainer.append("circle")
								 .attr("class", "EndCircle")
								 .on("mouseover", function() {					//Zmena barvy po najeti na prvek
        							d3.select(this).attr("fill", colorsHovering[1]);
      							 })
    							 .on("mouseout", function() {
         							d3.select(this).attr("fill", colors[1]);
    							 })
    							 .on("click", function(){			//Po klinuti se zobrazi info
    								d3.select("body").select(".cellInfo").selectAll("text").remove();
    								d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    												 .html("END of Cell: <b>" + cell.id + "</b><br/>BEGIN in Frame: <b>" + cell.begin + "</b><br/>END in Frame: <b>" + cell.end + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    							 })
    							 .attr("r", radius)
			   					 .attr("fill", colors[1]);

    if(isVertical){
    	endCircle.attr("cx", positionInGraph)
				 .attr("cy", linearScaleY(cell.end) + marginX/2);

    } else{
    	endCircle.attr("cx", linearScaleX(cell.end) + marginX/2)
				 .attr("cy", positionInGraph);
    }
}

//Funkce, ktera vytvori linku spoje mezi bodem mitotickeho deleni a nove vyniklou bunkou
//@param	positionInGraph 	pozice vykresleni
//@param 	ancestor 	 		bunka, ze ktere vznikly nove bunky
//@param	container 			svg, do ktereho linku vlozit
//@param	repairer			Y souradnice konce linky
//@param	child 				new cell
function connectParentChild(positionInGraph, ancestor, container, repairer, child){
	var ancestorLine = container.append("line")
								.attr("class", "ancestorLine")
								.attr("stroke-width", stroke)
                        		.attr("stroke", colors[4])
                        		.classed("superCell", true).datum(child.begin);

    if(isVertical){
    	ancestorLine.attr("x1", positionInGraph)
					.attr("y1", linearScaleY(ancestor.end) + marginX/2)
					.attr("x2", repairer)
					.attr("y2", linearScaleY(child.begin) + marginX/2);
    } else{
    	ancestorLine.attr("x1", linearScaleX(ancestor.end) + marginX/2)
					.attr("y1", positionInGraph)
					.attr("x2", linearScaleX(child.begin) + marginX/2)
					.attr("y2", repairer);
    }
}

function highestNumberOfChildren(cellArray){
	var highestNumber = cellArray[0].children.length;
	var i = 0;
	for(i; i < cellArray.length; i++){
		if(highestNumber < cellArray[i].children.length){
			highestNumber = cellArray[i].children.length;
		}
		if(cellArray[i].children.length != 0){
			var highestOfChildren = highestNumberOfChildren(cellArray[i].children);
			if(highestNumber < highestOfChildren){
				highestNumber = highestOfChildren;
			}
		}
	}
	return highestNumber;
}



/**************************************************************
   HORIZONTÁLNÍ VYKRESLENÍ
***************************************************************/

//Funkce, ktera zajisti, aby se vse vykreslilo Horizontalne
function displayHorizontal(){
	d3.selectAll("svg").remove();
	var m = 0;

	linearScaleX = d3.scale.linear()								//Priprava linearScale pro osu X
						.domain([0, maxTime])
						.range([0, graphBoxWidth - marginX]);

	//Vykresli pouze hlavni osu
	if(!everywhereAxis || smallVisualisation){
		displayXAxis();
	}
	var tmpScaler = false;
	var positionInGraphBoxSVG = 35;
	widthOfGraphBox = widthOfGraphBoxSVG()  + positionInGraphBoxSVG;
	if(everywhereAxis && !smallVisualisation){
		widthOfGraphBox += cells.length * 30;
	}

	var graphBoxSVG = d3.select("body").select(".graphBox").append("svg")
										.attr("width",  graphBoxWidth)
										.attr("id", "graphBoxSVG")
										.attr("height", widthOfGraphBox)
										.attr("class", "graphBoxSVG")
										.attr("version", 1.1)
        								.attr("xmlns", "http://www.w3.org/2000/svg");

    svgXAxis();
    disableSVGAxis();


	//Vytvori prazdny SVG, aby se to vyrovnalo
	displayBlock();

	//Vykresleni vsech bunecnych populaci
	for(m; m < cells.length; m++){
		branching = highestNumberOfChildren([cells[m]]);
		if((branching > 3) ||(cells[m].children.length > 3)){
			tmpScaler = true;
			changeScaleBranch(true);
			console.log("Branching of " + cells[m].id + " is " + branching);
		}
		if(branching < 2){
			branching = 2;
		}
		var depth = depthFinder(cells[m]);
		
		if(depth < 2){
			depth = 2;
		}
		var h = (Math.pow(branching,  depth) * scaler) - margin*(depth-1);		//vyska daneho rodokmenu

		var svgContainer = d3.select("body").select(".graphBoxSVG").append("g").datum(cells[m].id).attr("class", "svgContainer").attr("id", "svgContainer"+cells[m].id);

		displayPopulation(cells[m], (h)/2 + positionInGraphBoxSVG, svgContainer, h/cells[m].children.length, positionInGraphBoxSVG);		//zavolani funkce, ktera to vykresli

		//Vykresleni vlastni osy k dane populaci
		positionInGraphBoxSVG += h;
		if(everywhereAxis && !smallVisualisation){
			displayEverywhereXAxis(svgContainer, positionInGraphBoxSVG);
			positionInGraphBoxSVG += 30;
		}
		if(tmpScaler){
			tmpScaler = false;
			changeScaleBranch(false);
		}

	}
	displayLineX(svgContainer, widthOfGraphBox);
	if(!showLine){
		$(".movingLine").toggle(0);
	}
	if(!showLifeLengthText){
       	$(".lengthOfLifeText").toggle(0);
    }
    if(!showCellId){
		$(".idOfCell").toggle(0);
	}
	getAdditionalData(positionLine);
}

//Funkce, ktera zjisti hloubku dane bunecne populace, pro spravne vetveni a zobrazeni v grafu
//@param 	cell 	bunecna populace, ve ktere to hledam
function depthFinder(cell){
	if(cell.children.length != 0){						//pokud ma potomky
		if (cell.children.length == 1){					//a ma pouze jednoho
			return depthFinder(cell.children[0]) + 1;	//vratim hloubku z potomka
		}

		//najdu vetsi hloubku z obou potomku
		else{
			var a = depthFinder(cell.children[0]);
			var b = depthFinder(cell.children[1]);

			if (a > b){
				return 1 + a;
			}
			else{
				return 1 + b;
			}
		}
	}
	else{
		return 1;
	}
}


// Funkce, ktera vykresli vsechny body a spoje jedne bunky - Horizontalne
//@param	cell 	 		bunka, kterou vykresluji
//@param	positionY		pozice Y, kde vykreslim aktualni bunku
//@param	container 		SVG container, kam vykresluji
//@param 	repairer		hodnota o kolik se maji potomci posunout
function displayPopulation(cell, positionY, container, repairer, positionInGraphBoxSVG){
	var superCell = container.append("g").classed("superCell", true).datum([cell.begin, cell.end]);
	var tmpPosition = positionInGraphBoxSVG;
	displayBeginToEndLine(cell, superCell, positionY);

    if(!smallVisualisation){
       	displayLengthOfLife(cell, superCell, positionY);
       	
	}

	if(cell.end != cell.begin){
		displayBegin(cell, superCell, positionY);
	}


	if(!smallVisualisation){
		displayIdOfCell(cell, superCell, positionY);
		
   	}
   	tmpPosition += repairer/2;
   	if(cell.children.length != 0){			//pokud ma bunka potomky, vykreslim je
   		var i = 0;
   		for(i; i < cell.children.length; i++){
   			connectParentChild(positionY, cell, superCell, tmpPosition, cell.children[i]);
   			displayPopulation(cell.children[i], tmpPosition, container, (repairer/cell.children[i].children.length), tmpPosition - repairer/2);
   			tmpPosition = tmpPosition + repairer;
   		}
		if(cell.end != cell.begin){
			displayMitosis(cell, superCell, positionY);
		}
	} else{
		tmpPosition += repairer;
	  	if(cell.end != maxTime && cell.end != cell.begin){
   			displayEnd(cell, superCell, positionY);
		}
   	}

   	if(cell.end == cell.begin){
   		displayBothBeginEnd(cell, superCell, positionY);
   	}
}

//Vytvori maly prazdny svg blok
function displayBlock(){
	var svgBlok = d3.select("body").select(".graphBox").append("svg")
									.attr("width", graphBoxWidth)
									.attr("height", 30);
}

//Funkce, ktera vykresli hlavni osu X
function displayXAxis(){

	//Scale pro osu
	var xScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxWidth - marginX]);

	//Scale pro linku
	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxWidth - marginX])
							.range([0, maxTime]);

	//Vytvoreni svg osy

	var svgAxis = d3.select("body").select(".graphBox").append("svg")
									.attr("width", graphBoxWidth)
									.attr("height", 35)
									.attr("class", "svgAxis")
									.on("click", function(){
										lineX(Math.round(lineScaler(d3.mouse(this)[0] - marginX/2 + 2)));
	});

	var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//variables for axis
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(numberOfTicks);

	svgAxis.append("g").attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + 5 + ")")
			.call(xAxis);
}

//Funkce, ktera vykresli hlavni osu X
function svgXAxis(){

	//Scale pro osu
	var xScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxWidth - marginX]);

	//Scale pro linku
	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxWidth - marginX])
							.range([0, maxTime]);

	//Vytvoreni svg osy

	var svgAxis = d3.select(".graphBoxSVG").append("g").attr("class", "axisSVG")
									.attr("width", graphBoxWidth)
									.attr("height", 35)
									.on("click", function(){
										lineX(Math.round(lineScaler(d3.mouse(this)[0] - marginX/2 + 2)));
	});

	var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//variables for axis
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(numberOfTicks);

	svgAxis.append("g").attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + 5 + ")").attr("stroke", "black").attr("fill", "none")
			.call(xAxis);
}

function displayLineX(svgContainer, height){
	svgContainer.append("line")
			.attr("x1", linearScaleX(positionLine) + marginX/2)
			.attr("y1", 5)
			.attr("x2", linearScaleX(positionLine) + marginX/2)
			.attr("y2", height)
			.attr("stroke-width", 1.5)
			.attr("stroke", "#e41a1c")
			.attr("id", "movingLine")
			.attr("class", "movingLine");
}

function displayLineY(svgContainer, height){
	svgContainer.append("line")
			.attr("x1", 5)
			.attr("y1", linearScaleY(positionLine) + marginX/2)
			.attr("x2", height)
			.attr("y2", linearScaleY(positionLine) + marginX/2)
			.attr("stroke-width", 1.5)
			.attr("stroke", "#e41a1c")
			.attr("id", "movingLine")
			.attr("class", "movingLine");
}

//Function, which will change the position of the line in axis graph
//@param 	position 	new position in the graph
//@param 	svgAxis		axisGraph where the line is
function lineX(position){
	//is position out of axis?
	if(position > maxTime){
		position = maxTime;
	} else if((position) < 0){
		position = 0;
	}

	positionLine = position;

	//change position of the line
	d3.select("#movingLine")
		.attr("x1", linearScaleX(positionLine) + marginX/2)
		.attr("x2", linearScaleX(positionLine) + marginX/2);

	getAdditionalData(positionLine);
}

//Funkce, ktera vykresli osu k dane populaci
function displayEverywhereXAxis(svgContainer, position){
	var xScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxWidth - marginX]);

	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxWidth - marginX])
							.range([0, maxTime]);

	var svgAxis = svgContainer.append("svg").attr("class", "xAxis").on("click", function(){
										lineX(Math.round(lineScaler(d3.mouse(this)[0] - marginX/2 + 2)));
	});

	svgAxis.append("rect")
    		.attr("width", graphBoxWidth)
    		.attr("height", 30)
    		.attr("transform", "translate("+ marginX/6 + "," + (5 + position) + ")")
    		.attr("fill", "white");


    var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//promenne pro osy
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(numberOfTicks);

	svgAxis.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + (5 + position) + ")").attr("stroke", "black").attr("fill", "none")
			.call(xAxis);
}

//Funkce, ktera vykresli osu k dane populaci
function displayEverywhereYAxis(svgContainer, position){
	var yScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxHeightVertical - marginX]);

	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxHeightVertical - marginX])
							.range([0, maxTime]);

	var svgAxis = svgContainer.append("svg").attr("class", "yAxis").on("click", function(){
										lineY(Math.round(lineScaler(d3.mouse(this)[1] - marginX/2 + 2)));
	});

	svgAxis.append("rect")
    		.attr("width", 30)
    		.attr("height", graphBoxHeightVertical)
    		.attr("transform", "translate("+ (position - 20) + "," + 0 + ")")
    		.attr("fill", "white");


    var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//promenne pro osy
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.ticks(numberOfTicks);

	svgAxis.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+ (5 + position) + "," + marginX/2 + ")").attr("stroke", "black").attr("fill", "none")
			.call(yAxis);
}

//Function will get the text list of children of the cell
//@parent 	parent of the children
//@return	text of children
function getChildrenText(parent){
	if(parent.children.length == 1){
		return "" + parent.children[0].id;
	}else if(parent.children.length == 2){
		return "" + parent.children[0].id + " and " + parent.children[1].id;
	}
	else{
		return "None";
	}
}



/**************************************************************
   VERTICAL DISPLAY
***************************************************************/

//Function will count the width of GraphBoxSVG
//@return	result		counted width
function widthOfGraphBoxSVG(){
	var i = 0;
	var result = 0;
	var tmpScaler = false;
	//adding width of every graph to the result
	for(i; i < cells.length; i++){
		branching = highestNumberOfChildren([cells[i]]);
		if(branching < 2){
			branching = 2;
		}
		var tmpDepth = depthFinder(cells[i]);
		if(tmpDepth < 3){
			tmpDepth = 2;
		}
		if(branching > 3){
			tmpScaler = true;
			changeScaleBranch(true);
		}
		result += Math.pow(branching,  tmpDepth) * scaler - scaler*(tmpDepth-1);
		console.log("B: " + cells[i].id + " " +result);
		if(tmpScaler){
			tmpScaler = false;
			changeScaleBranch(false);
		}
	}
	return result;
}

//Function will display Y axis of Vertical graph
function displayYAxis(){

	//Scale pro osu
	var yScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxHeightVertical - marginX]);

	//Scale pro linku
	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxHeightVertical - marginX])
							.range([0, maxTime]);

	//Vytvoreni svg osy
	var svgYAxis = d3.select("body").select(".graphBox").append("svg")
									.attr("width", 35)
									.attr("height", graphBoxHeightVertical)
									.attr("class", "svgYAxis")
									.on("click", function(){
										lineY(Math.round(lineScaler(d3.mouse(this)[1] - marginX/2 + 2)));
	});

	var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//variables for axis
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.ticks(numberOfTicks);

	svgYAxis.append("g").attr("render-order", "1")
			.attr("class", "axis")
			.attr("transform", "translate("+ 30 + "," + marginX/2 + ")")
			.call(yAxis);
}

function svgYAxis(){

	//Scale pro osu
	var yScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxHeightVertical - marginX]);

	//Scale pro linku
	var lineScaler = d3.scale.linear()
							.domain([0, graphBoxHeightVertical - marginX])
							.range([0, maxTime]);

	//Vytvoreni svg osy
	var svgYAxis = d3.select(".graphBoxSVG").append("g").attr("class", "axisSVG")
									.attr("width", 35)
									.attr("height", graphBoxHeightVertical)
									.on("click", function(){
										lineY(Math.round(lineScaler(d3.mouse(this)[1] - marginX/2 + 2)));
	});

	var numberOfTicks = 30;
	if(maxTime < 30){
		numberOfTicks = maxTime;
	}

	//variables for axis
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.ticks(numberOfTicks);

	svgYAxis.append("g").attr("render-order", "1")
			.attr("class", "axis")
			.attr("transform", "translate("+ 30 + "," + marginX/2 + ")").attr("stroke", "black").attr("fill", "none")
			.call(yAxis);
}

function changeScaleBranch(value){
	if(value){
		if(smallVisualisation){
			scaler = 3;
		} else{
		scaler = 10;
		}
	} else{
		if(smallVisualisation){
			scaler = 10;
		} else{
		scaler = 50;
		}
	}
}

//Function, which will change the position of the line in axis graph
//@param 	position 	new position in the graph
//@param 	svgAxis		axisGraph where the line is
function lineY(position){
	//is position out of axis?
	if(position > maxTime){
		position = maxTime;
	}
	else if((position) < 0){
		position = 0;
	}
	positionLine = position;

	//change position of the line
	d3.select("#movingLine")
		.attr("y1", linearScaleY(positionLine) + marginX/2)
		.attr("y2", linearScaleY(positionLine) + marginX/2);

	getAdditionalData(position);
}

function displayVertical(){
	d3.selectAll("svg").remove();
	var m = 0;
	linearScaleY = d3.scale.linear()							//scaler for vertical display
						 .domain([0, maxTime])
						 .range([0, graphBoxHeightVertical - marginX]);

	if(!everywhereAxis || smallVisualisation){
		displayYAxis();
	}

	var tmpScaler = false;
	var positionInGraphBoxSVG = 35;

	widthOfGraphBox = widthOfGraphBoxSVG()  + positionInGraphBoxSVG;
	if(everywhereAxis && !smallVisualisation){
		widthOfGraphBox += cells.length * 30;
	}

	var graphBoxSVG = d3.select("body").select(".graphBox").append("svg")
										.attr("width", widthOfGraphBox)
										.attr("height", graphBoxHeightVertical)
										.attr("class", "graphBoxSVG")
										.attr("id", "graphBoxSVG")
										.attr("version", 1.1)
        								.attr("xmlns", "http://www.w3.org/2000/svg");

  svgYAxis();
  disableSVGAxis();

	for(m; m < cells.length; m++){
		branching = highestNumberOfChildren([cells[m]]);
		if(branching > 2){
			tmpScaler = true;
			changeScaleBranch(true);
		}
		if(branching < 2){
			branching = 2;
		}

		var depth = depthFinder(cells[m]);
		if(depth < 3){
			depth = 2;
		}
		var w = (Math.pow(branching,  depth) * scaler) - margin*(depth-1);			//vytvoreni sirky daneho svg rodokmenu

		//Vytvoreni SVG containeru
		var svgContainer = d3.select("body").select(".graphBoxSVG").append("g").datum(cells[m].id);
		if(everywhereAxis && !smallVisualisation){
			displayEverywhereYAxis(svgContainer, positionInGraphBoxSVG);

		}

		displayPopulation(cells[m], (w)/2 + positionInGraphBoxSVG, svgContainer, w/cells[m].children.length, positionInGraphBoxSVG);
		positionInGraphBoxSVG += w;

		if(everywhereAxis && !smallVisualisation){
			positionInGraphBoxSVG += 30;
		}

		if(tmpScaler){
			tmpScaler = false;
			changeScaleBranch(false);
		}

	}
	
	displayLineY(svgContainer, widthOfGraphBox);
	
	
	if(!showLine){
		$(".movingLine").toggle(0);
	}
	if(!showLifeLengthText){
       	$(".lengthOfLifeText").toggle(0);
    }
    if(!showCellId){
		$(".idOfCell").toggle(0);
	}
	getAdditionalData(positionLine);
}

function svgTooltip(cell){
	console.log("SVG tooltip with cell " + cell.id);
	displayScale = false;
	changeScales();
	var depthCell = depthFinder(cell);
	var w = Math.pow(2,  depthCell) * scaler - margin*(depthCell-1);

	var svgContainer = d3.select(".tooltip").append("svg").attr("width", w - margin*(depthCell-1))
								 .attr("height", graphBoxHeightVertical).attr("class", "tooltipSVG");

	displayPopulation(cell, (w - margin*(depthCell-1))/2, svgContainer, (w - margin*(depthCell-1))/4);
	changeScales();
	displayScale = true;
	console.log(d3.select(".tooltipSVG"));
	return svgContainer;
}


/**************************************************************
   GGRAPH OF STATES + LIFE GRAPH
***************************************************************/

//Function will get info about all cells in certain time and show the graph of states and graph of lives of living cells
//@param 	position 	in what time we want to the info
function getAdditionalData(position){
	begin = 0;
	mitosis = 0;
	death = 0;
	var c = 0;

	while(lifeGraphCells.length > 0){
		lifeGraphCells.pop();
	}

	//we will chceck all cells and get the data
	for(c; c < cells.length; c++){
		checkCell(cells[c], position);
	}

	var dataStates = [begin, death, mitosis, lifeGraphCells.length];		//info about possible states\

	document.getElementById("interestingInfoText").innerHTML = interestingInfoText + positionLine;

	d3.selectAll(".stats").remove();

	//creating svg of graph of states
	var life = d3.select("body").select(".interestingInfo").append("svg")
					.attr("width", 350)
					.attr("height", 105)
					.attr("class", "stats")
					.attr("id", "stat");

	//display bars of states
	for(var i = 0; i < 4; i++){
		life.append("rect")
			.attr("x", 25 + margLife + posunuti)
			.attr("y", (i * 25) + 5 )
			.attr("width", 5 * dataStates[i])
			.attr("height", 20)
			.attr("fill", colors[i])

		life.append("text")
				.text(dataStates[i])
				.attr("x", posunuti + margLife)
				.attr("y", (i * 25) + 20)
				.attr("font-family", "sans-serif")
				.attr("font-size", 15)
				.attr("fill", "black");

		life.append("text")
				.text(description[i])
				.attr("x", 5)
				.attr("y", (i * 25) + 20 )
				.attr("font-family", "sans-serif")
				.attr("font-size", 15)
				.attr("fill", "black");
	}

	//Display life Graph of living cells
	d3.select('#deleteLife').remove();
	if(lifeGraphCells.length != 0){
		displayLifeGraph();
	}
}

//Function will display life graph of living cells in certain time
function displayLifeGraph(){
	var c = 0;
	var lifeLinearX = d3.scale.linear().domain([0, maxTime]).range([0, 310]);

	sortByIdSmth(lifeGraphCells);

	var lifeHeight = lifeGraphCells.length*20 + 20;

	var lifeGraph = d3.select("body").select(".lifeGraph").append("svg")
						.attr("width", 430)
						.attr("height",  lifeHeight)
						.attr("class", "lifeGraphg")
						.attr("id", "deleteLife");

	//we will display life of every living cell (array of lifeGraphCells)
	for(c; c < lifeGraphCells.length; c++){
		var lifeContainer = lifeGraph.append("g").attr("class", "cellLife");

		var idText = lifeContainer.append("text")
										.text(lifeGraphCells[c].id + ": ")
										.attr("x", 5)
			   							.attr("y", c * 20 + 25)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight[activeFontText]);

		var lifeLine = lifeContainer.append("line")
						.attr("x1", function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y1", function(){
							return c * 20 + 20;
						})
						.attr("x2", function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y2", function(){
							return c * 20 + 20;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");

		var lifeBegin = lifeContainer.append("line")
						.attr("x1",function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y1", function(){
							return c * 20 + 15;
						})
						.attr("x2",function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y2", function(){
							return c * 20 + 25;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");

		var lifeBeginText = lifeContainer.append("text")
										.text(lifeGraphCells[c].begin)
										.attr("x", lifeLinearX(lifeGraphCells[c].begin) - 5 + margLife)
			   							.attr("y", c * 20 + 25)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight[activeFontText]);

		var lifeEnd = lifeContainer.append("line")
						.attr("x1",function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y1", function(){
							return c * 20 + 15;
						})
						.attr("x2",function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y2", function(){
							return c * 20 + 25;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");

		var lifeEndText = lifeContainer.append("text")
										.text(lifeGraphCells[c].end)
										.attr("x", lifeLinearX(lifeGraphCells[c].end) + 25 + margLife)
			   							.attr("y", c * 20 + 25)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight[activeFontText]);
	}

	var wholeLine = lifeContainer.append("line")
							.attr("x1", function(){
								return lifeLinearX(positionLine) + 20 + margLife;
							})
							.attr("y", function(){return 0;})
							.attr("x2", function(){return lifeLinearX(positionLine) + 20 + margLife;})
							.attr("y2", function(){return 1200;})
							.attr("stroke-width", 1)
							.attr("stroke", "#e41a1c");
}

//Function will save info about cell in certain time
//@param	cell 		cell we want to know info about
//@param	position 	in what time we want to know what is happening
function checkCell(cell, position){
	//was cell born?
	if(cell.begin == position){
			begin++;
	}

	//Or was it its death or mitosis?
	if((cell.end == position) && (cell.end != maxTime)){
		if(cell.children.length > 0){
			mitosis++;
		}
		else{
			death++;
		}
	}

	//or was it alive?
	else if(((position > cell.begin) && (position < cell.end)) || ((cell.end == position) && (cell.end == maxTime))){
		lifeGraphCells.push(cell);
	}


	//check what happend to its children
	else{
		if((cell.children.length > 0) && (position > cell.end)){
			var d = 0;
			for(d; d<cell.children.length; d++){
				checkCell(cell.children[d], position);
			}
		}
	}
}
