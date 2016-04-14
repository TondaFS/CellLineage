/***************************************************************
	VARIABLES
***************************************************************/
var maxTime = 0;			//Maximalni doba zaznamu
var margin = 50;			//okraj SVG - menitelny v ramci scales!
var marginX = 50;			//margin for X - nemenitelny
var polomer = 7;			//polomer kruhu
var stroke = 3;				//sirka linek
var scaler = 50;			//rozpeti na osach
var positionLine = 0;		//position of line

var cells = []; 			//seznam objektu bunek
var datacells = [];			//pro ulozeni bunecnych poli
var lifeGraphCells = [];	//array for storing cells for lifeGraph

//variables for info about states of cells
var begin = 0;
var mitosis = 0;
var death = 0;

//zmenit nazev!
var posunuti = 10;		//Posunuti hodnot v life graphu vedle poctu ZIJE, SMRT, MITOSA...

//nastaveni
var isVertical = false;					//is vertical display choosed?
var changeMaxTime = false;				//should i change maxTime?
var showFrom = 0;						
var showTo = 0;							
var everywhereAxis = false;				//Zobrazeni osy u kazdeho grafu				
var destroySVG = false;					
var smallVisualisation = false;
var showLifeLengthText = true;	
var showCellId = true;
var textHeight = ["12px", "14px", "16px", "18px", "20px"];				
var margLife = 60;						//Okraj pro LifeGraph
var activeFontId = 1;
var activeFontLife = 1;
var activeFontText = 1;

var linearScaleX;						//Linear scale for X axis
var linearScaleY;						//Linear scale for y axis
var graphBoxWidth = 1000;				//Sirka grafu s rodokmeny
var graphBoxHeightVertical = 900;		//Height of graph box for vertical display


var description = ["BEGIN", "END", "MITOSIS", "ALIVE"];

//colors				 BEGIN  	END 	   MITOSIS    ALIVE  	 LINE     
var colors = 			["#377eb8", "#e41a1c", "#4daf4a", "#984ea3", "#000000"];
var colorsHovering = 	["#87b1d4", "#ee7576", "#94cf92", "#c194c7", "#666666"];

//preparing jquery
$( document ).ready(function() {
    console.log( "jquery ready!" );
});



/**************************************************************
	LOAD DATA
***************************************************************/
//Reakce na nahrani souboru 
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
  		throw new Error("Not supported format - file is not .txt!");
  		return;
  	}

  	var reader = new FileReader();
  	reader.onload = function(e) {  
  		var contents = e.target.result;  				
  		parseData(contents);
  		changeMaxTime = true; 
  		horizontal();
  		sliderManager();
	};
  
  reader.readAsText(file);
}

function checkFileName(name){
	var length = name.length;
	var i = length - 4;
	var str1 = name.substring(i, length);
	var str2 = ".txt";
	return str1.localeCompare(str2);
}

//Funkce, ktera ze vstupniho textoveho retezce (souboru), vyparsuje data bunek do objektu k pozdejsimu vyuziti
//@param 	text 	string celeho textoveho souboru track.txt
function parseData(text){			
	var tmpPole = [];												//Pomocne pole pro ulozeni vsech 4 hodnot bunky
	var tmpPromenna = "";											//pomocny string pro ukladani cisel
	var i = 0;														//promenna pro pruchod prvniho for cyklu
	var z = 0;														//promenna pro pruchod druheho for cyklu
	index = 0;														//promenna na uchovani informace o rodici

	//Vynulovani maximalni delky grafu
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

	//cyklus, ktery z retezce "text" ulozi do pole "cells" kazdou bunku jako pole se 4 hodnotami
	for(i; i < text.length; i++){

		if(text[i] == "\n"){										//Pokud je konec radku						
			if(isNaN(+tmpPromenna)){
				throw new Error("Not supported data! - in row " + (datacells.length + 1) + " there are not only numbers!");
			}
			tmpPole.push(+tmpPromenna);								//ulozim do pole posledni hodnotu

			if((tmpPole.length < 4) || (tmpPole.length > 4)){		//Jsou na radku pouze 4 cisla?
				throw new Error("Not supported data! - in row " + (datacells.length) + " there are more or less than 4 numbers!");
			}

			datacells.push(tmpPole);								//pole bunky ulozim do "datacells"
			tmpPole = [];											//vyprazdnim pomocne pole pro bunku
			tmpPromenna ="";										//vyprazdnim pomocny retezec pro promennou
		}

		else if(text[i] != " "){									//Pokud to neni mezera
			tmpPromenna += text[i]; 								//Jedna se o cifru cisla, ulozim do pomocneho retezce pro promennou
		}

		else{														//Jedna se o mezeru
			if(isNaN(+tmpPromenna)){
				throw new Error("Not supported data! - in row " + (datacells.length + 1) + " there are not only numbers!");
			}
			tmpPole.push(+tmpPromenna);								//ulozim do pole cislo
			tmpPromenna = "";										//vyprazdnim pomocny retezec pro promennou
		}
	}	

	//Cyklus, ktery projde vsechny bunky v poli "datacells" a vytvori z nich "objektovy" rodokmen - tzn. objekt predek, majici v sobe potomky atd.
	for(z; z < datacells.length; z++){
		tmpPole = datacells[z];										//aktualni bunka
		var parent;													//promenna pro nasledne hledani rodice
				
		//vytvoreni noveho objektu bunky s daty: ID, ČAS VZNIKU, ČAS ZÁNIKU/MITOTICKÉ DĚLENÍ, SEZNAM POTOMKŮ
		var cell = {
			id: tmpPole[0],
			begin: tmpPole[1],
			end: tmpPole[2],
			parentID: tmpPole[3],
			children: []
		}

		if(maxTime < cell.end){										//podminka kontroluje posledni dobu v rodokmenu, pripadne upravi
			maxTime = cell.end;				
		}


		if(cell.parentID == 0){										//pokud nema bunka rodice
			cells.push(cell);										//je to prvni bunka v rodokmenu -> novou "populaci" ulozim do seznamu populaci bunek
		}
		else{														//pokud ma rodice, patri do jiz existujici "populace"	
			findParent(cell.parentID, cell, cells);					//vyhleda sveho rodice mezi vsemi existujcimi populacemi a jejich bunkami					
		}
	}
}

//Funkce, ktera najde rodice bunky a ulozi ji mezi jeji rodice
//@param 	parentID	id rodice, ktereho hledam
//@param	cell 		bunka, kterou chci ulozit
//@param 	celles 		seznam bunek, ktery aktualne prochazim 

function findParent(parentID, cell, celles){
	var j = 0;														
	for(j; j < celles.length; j++){								//prochazim seznam bunek 
		if(celles[j].id == parentID){							//pokud je id aktualni bunky rovno hledanemu rodici 
			celles[j].children.push(cell);						//ulozim bunku mezi jeji potomky	
			break;
		}	
		else if(celles[j].children != null){					//pokud ma bunka potomky					
			findParent(parentID, cell, celles[j].children);		//zkusim najit rodice mezi nimi
		}				
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

function makePDF(){
	console.log("Not working yet!");
}

$("#idShow").click(function(){
        $(".idOfCell").toggle(400);
    });

$("#lifeText").click(function(){
        $(".lengthOfLifeText").toggle(400);
});

function vertical(){
	showFrom = 0;
	showTo = maxTime;
	isVertical = true;
	display();
}

function horizontal(){
	isVertical = false;	
	everywhereAxis = false;	
	showFrom = 0;
	showTo = maxTime;
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
		polomer = 2;
		stroke = 1;
		
		margin = 10;
	}
	else{
		scaler = 50;
		polomer = 7;
		stroke = 3;
		
		margin = 50;
	}

	display();
}

function display(){
	if(isVertical){
		displayVertical();
	} else{
		displayHorizontal();
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
				if(this.__data__ < showFrom || this.__data__ > showTo){
					d3.select(this).classed("superCell", false);
					d3.select(this).classed("hide", true);
					$(this).toggle(250);
				}
			})

			d3.selectAll(".hide").each(function(d, i){
				if(this.__data__ >= showFrom && this.__data__ <= showTo){
					d3.select(this).classed("hide", false);
					d3.select(this).classed("superCell", true);
					$(this).toggle(250);									
				}
			})
			
		},
		stop: function(event, ui){
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
    				 							.html("Cell: <b>" + cell.id + "</b><br/>Lenght of life: <b>" + (cell.end - cell.begin)+"</b>")
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
		var timeDisplay = cellContainer.append("text").classed("lengthOfLifeText", true)		
    								   .text(function(){
    										var result = cell.end - cell.begin;
    										if(result < 5 && maxTime > 20){
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
    													.html("Cell: <b>" + cell.id + "</b><br/>Begin Frame: <b>" + cell.begin + "</b><br/>End or mitosis in Frame: <b>" + cell.end + "</b><br/>Parent: <b>" + cell.parentID + "</b><br/>Children: <b>" + childrenText+"</b>")
    								})
    								.attr("r", polomer)
			   						.attr("fill", colors[0]);

	if(isVertical){
		beginCircle.attr("cx", positionInGraph)
				   .attr("cy", linearScaleY(cell.begin)+ marginX/2);

	} else{
		beginCircle.attr("cx", linearScaleX(cell.begin) + marginX/2)
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
			   					.attr("text-anchor", "right");

	if(isVertical){
		idOfCell.attr("x", positionInGraph + 10)
			   	.attr("y", linearScaleY(cell.begin) + marginX - 10);
	} else{
		idOfCell.attr("x", linearScaleX(cell.begin) + marginX - 10)
			   	.attr("y", positionInGraph - 7);
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
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", textHeight[activeFontText])
    													.html("Mitotis of Cell: <b>" + cell.id + "</b><br/>In Frame: <b>" + cell.end + "</b><br/>New cells: <b>" + childrenText+"</b>")
    							 	 })	
    							 	 .attr("r", polomer)
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
    												 .html("End of Cell: <b>" + cell.id + "</b><br/>In Frame: <b>" + cell.end+"</b>")
    							 })
    							 .attr("r", polomer)
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
					.attr("x2", positionInGraph + repairer)
					.attr("y2", linearScaleY(child.begin) + marginX/2);
    } else{
    	ancestorLine.attr("x1", linearScaleX(ancestor.end) + marginX/2)
					.attr("y1", positionInGraph)
					.attr("x2", linearScaleX(child.begin) + marginX/2)
					.attr("y2", positionInGraph + repairer);
    }								
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

	//Vytvori prazdny SVG, aby se to vyrovnalo
	displayBlock();

	//Vykresleni vsech bunecnych populaci
	for(m; m < cells.length; m++){
		//nastvaveni, ze se ma smazat pro pripad, ze se nevykresli zadna bunka
		destroySVG = true;

		var depth = depthFinder(cells[m]);		
		var h = (Math.pow(2,  depth) * scaler) - margin*(depth-1) ;		//vytvoreni vysky daneho svg rodokmenu		

		//Vytvoreni SVG containeru
		var svgContainer = d3.select("body").select(".graphBox").append("svg")
											.attr("width", graphBoxWidth)
											.attr("height", h - margin*(depth-1))
											.datum(cells[m])
											.on("mouseover", function(d) {
												if(smallVisualisation){
													displayThisShit(d);
												}
											})
											//.attr("class", "svgContainer" + cells[m].id)
											.attr("id", "svgContainer"+cells[m].id)
											.attr("version", 1.1)
        									.attr("xmlns", "http://www.w3.org/2000/svg");

		
		displayHorizontalPopulation(cells[m], (h - margin*(depth-1))/2, svgContainer, (h - margin*(depth-1))/4);		//zavolani funkce, ktera to vykresli	
		
		//Pokud se do svgConatineru nic nevykreslilo, smaze jej
		if(destroySVG){
			svgContainer.remove();
		} else{
			//Vykresleni vlastni osy k dane populaci
			if(everywhereAxis && !smallVisualisation){
				displayEverywhereXAxis(maxTime);
			}
		}
	}
	getAdditionalData(positionLine);		
}

function displayThisShit(cell){
	console.log("Displaying this Shit: " + cell.id);

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
function displayHorizontalPopulation(cell, positionY, container, repairer){	
	var shown = false;
	var superCell = container.append("g").classed("superCell", true).datum(cell.begin);

	if((cell.begin >= showFrom) && (cell.begin <= showTo)){
		destroySVG = false;
		shown = true;

		displayBeginToEndLine(cell, superCell, positionY);
        
        if(showLifeLengthText && !smallVisualisation){
        	displayLengthOfLife(cell, superCell, positionY);
   		}   		

   		displayBegin(cell, superCell, positionY);			   								
		
		if(!smallVisualisation && showCellId){	
			displayIdOfCell(cell, superCell, positionY);
   		}
 	}
   			
   	if(cell.children.length != 0){											//pokud ma bunka potomky, vykreslim je 				
		if(shown){							//Pokud se vykreslila aktuani bunka, spojim	s potomky
			if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){		
				connectParentChild(positionY, cell, superCell, -repairer, cell.children[0]);
			}
		}
			
		if(cell.children.length == 1){				
			displayHorizontalPopulation(cell.children[0], positionY - repairer, container, repairer/2);			
		} else{
			if(shown){
				if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
					connectParentChild(positionY, cell, superCell, repairer, cell.children[1]);
				}
			}
			displayHorizontalPopulation(cell.children[0], positionY - repairer, container, repairer/2);
			displayHorizontalPopulation(cell.children[1], positionY + repairer, container, repairer/2);
		}

		if(shown){
			displayMitosis(cell, superCell, positionY);
		}
	  } else{	
   			if(cell.begin >= showFrom && cell.begin <= showTo){
   				if(cell.end != maxTime){	
   						displayEnd(cell, superCell, positionY);
			   	}
		}
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
									.attr("height", 30)
									.attr("class", "svgAxis")
									.on("click", function(){
										lineX(Math.round(lineScaler(d3.mouse(this)[0] - marginX/2 + 2)), svgAxis);
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

	svgAxis.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + 5 + ")")
			.call(xAxis);

	//Attach line of position in the axisGraph
	svgAxis.append("line")			
			.attr("x1", linearScaleX(positionLine) + marginX/2)	
			.attr("y1", 5)
			.attr("x2", linearScaleX(positionLine) + marginX/2)
			.attr("y2", graphBoxHeightVertical)
			.attr("stroke-width", 2.5)
			.attr("stroke", "#e41a1c")
			.attr("id", "movingLine");
}

//Function, which will change the position of the line in axis graph
//@param 	position 	new position in the graph
//@param 	svgAxis		axisGraph where the line is 
function lineX(position, svgAxis){
	positionLine = position;

	//is position out of axis?
	if(position > maxTime){
		position = maxTime;
	}
	else if((position) < 0){
		position = 0;
	}
	
	//change position of the line
	svgAxis.select("#movingLine")
		.attr("x1", linearScaleX(position) + marginX/2)
		.attr("x2", linearScaleX(position) + marginX/2);

	getAdditionalData(position);
}

//Funkce, ktera vykresli osu k dane populaci
//@param 	xTime	celkova doba, tzn. sirka osy
function displayEverywhereXAxis(){
	var xScale = d3.scale.linear()
						.domain([0, maxTime])
						.range([0, graphBoxWidth - marginX]);	

	var svgAxis = d3.select("body").select(".graphBox").append("svg")
									.attr("width", graphBoxWidth)
									.attr("height", 30)
									.attr("class", "xAxis");
	svgAxis.append("rect")
    		.attr("width", "100%")
    		.attr("height", "100%")
    		.attr("fill", "white");

	//promenne pro osy
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(30);

	svgAxis.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + 5 + ")")
			.call(xAxis);
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

	//adding width of every graph to the result
	for(i; i < cells.length; i++){
		var tmpDepth = depthFinder(cells[i]);
		result += Math.pow(2,  tmpDepth) * scaler - 2*(margin*(tmpDepth-1));
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
										lineY(Math.round(lineScaler(d3.mouse(this)[1] - marginX/2 + 2)), svgYAxis);
	});

	//variables for axis
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.ticks(30);

	svgYAxis.append("g").attr("render-order", "1")
			.attr("class", "axis")
			.attr("transform", "translate("+ 30 + "," + marginX/2 + ")")
			.call(yAxis);

	//Attach line of position in the axisGraph
	svgYAxis.append("line")
			.attr("render-order", "2")
			.attr("x1", 5)	
			.attr("y1", linearScaleY(positionLine) + marginX/2)
			.attr("x2", graphBoxWidth)
			.attr("y2", linearScaleY(positionLine) + marginX/2)
			.attr("stroke-width", 2.5)
			.attr("stroke", "#e41a1c")
			.attr("id", "movingLine");
}

//Function, which will change the position of the line in axis graph
//@param 	position 	new position in the graph
//@param 	svgAxis		axisGraph where the line is 
function lineY(position, svgAxis){
	positionLine = position;

	//is position out of axis?
	if(position > maxTime){
		position = maxTime;
	}
	else if((position) < 0){
		position = 0;
	}
	
	//change position of the line
	svgAxis.select("#movingLine")
		.attr("y1", linearScaleY(position) + marginX/2)
		.attr("y2", linearScaleY(position) + marginX/2);

	getAdditionalData(position);
}

function displayVertical(){	
	d3.selectAll("svg").remove();
	
	var m = 0;

	
	linearScaleY = d3.scale.linear()							//scaler for vertical display
						 .domain([0, maxTime])
						 .range([0, graphBoxHeightVertical - marginX]);	

	displayYAxis();

	var graphBoxSVG = d3.select("body").select(".graphBox").append("svg")
										.attr("width", widthOfGraphBoxSVG() + 35)
										.attr("height", graphBoxHeightVertical)
										.attr("class", "graphBoxSVG")
										.attr("version", 1.1)
        								.attr("xmlns", "http://www.w3.org/2000/svg");

	var positionInGraphBoxSVG = 35;
	

	for(m; m < cells.length; m++){	
		destroySVG = true;

		var depth = depthFinder(cells[m]);

		var w = Math.pow(2,  depth) * scaler - margin*(depth-1);			//vytvoreni sirky daneho svg rodokmenu					

		//Vytvoreni SVG containeru
		var svgContainer = d3.select("body").select(".graphBoxSVG").append("g");

		svgContainer.append("svg").attr("width", w - margin*(depth-1))
								 .attr("height", graphBoxHeightVertical);

		displayPopulationV(cells[m], (w - margin*(depth-1))/2 + positionInGraphBoxSVG, svgContainer, (w - margin*(depth-1))/4);		//zavolani funkce, ktera to vykresli
		

		if(destroySVG){
			svgContainer.remove();
		} else{
			positionInGraphBoxSVG += (w - margin*(depth-1)); 			
		}

		getAdditionalData(positionLine);
	}
}

function displayPopulationV(cell, positionX, container, repairer){
	var shown = false;
	var superCell = container.append("g").classed("superCell", true).datum(cell.begin);
	
	if((cell.begin >= showFrom) && (cell.begin <= showTo)){
		destroySVG = false;
		shown = true;

		displayBeginToEndLine(cell, superCell, positionX);

        if(showLifeLengthText && !smallVisualisation){
        	displayLengthOfLife(cell, superCell, positionX);        	
   		}

   		displayBegin(cell, superCell, positionX);

   		

		if(!smallVisualisation && showCellId){
			displayIdOfCell(cell, superCell, positionX);
   		}
	}

	if(cell.children.length != 0){
		if(shown){
			if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
				connectParentChild(positionX, cell, superCell, -repairer, cell.children[0]);
			}
		}

		if(cell.children.length == 1){
			displayPopulationV(cell.children[0], positionX - repairer, container, repairer/2);
		} else{
			if(shown){
				if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
					connectParentChild(positionX, cell, superCell, repairer, cell.children[1]);
				}
			}
			displayPopulationV(cell.children[0], positionX - repairer, container, repairer/2);
			displayPopulationV(cell.children[1], positionX + repairer, container, repairer/2);
		}

		if(shown){
			displayMitosis(cell, superCell, positionX);
		}

	} else{	
		if((cell.begin >= showFrom && cell.begin <= showTo) && cell.end != maxTime){
			displayEnd(cell, superCell, positionX);
		}
	}
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

	var dataStates = [begin, death, mitosis, lifeGraphCells.length];		//info about possible states

	d3.selectAll(".stats").remove();

	//creating svg of graph of states
	var life = d3.select("body").select(".interestingInfo").append("svg")
					.attr("width", 350)
					.attr("height", 105)
					.attr("class", "stats");

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
	else if((cell.end == position) && (cell.end != maxTime)){
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