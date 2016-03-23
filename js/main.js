/***************************************************************
	PROMENNE
***************************************************************/
//Moznno smazat!
//var data;					//data bunek
//var scalerX = 12;			//rozpeti na ose X
//var lifeTime = false;	

var w = 1000;				//šířka grafu
var h = 0;					//výška grafu
var margin = 50;			//okraj SVG
var polomer = 7;			//polomer kruhu
var stroke = 3;				//sirka linek

var maxTime = 0;			//Maximalni doba zaznamu

var cells = []; 			//seznam objektu bunek
var datacells = [];			//pro ulozeni bunecnych poli
var lifeGraphCells = [];	//array for storing cells for lifeGraph

var scaler = 50;			//rozpeti na osach

var positionLine = 0;
var marginX = 50;

//variables for info about states of cells
var begin = 0;
var mitosis = 0;
var death = 0;

var posunuti = 10;		//Posunuti hodnot v life graphu vedle poctu ZIJE, SMRT, MITOSA...

//nastaveni
var changeMaxTime = false;
var showNoChild = false;				//Nezobrazi bunky, ktere nemaji potomky
var showFrom = 0;						//Zobrazeni od
var showTo = 0;							//Zobrazeni do
var everywhereAxis = false;				//Zobrazeni osy u kazdeho grafu				
var destroySVG = false;					
var smallVisualisation = false;
var showLifeLengthText = true;	
var textHeight = "12px";
var margLife = 60;						//Okraj pro LifeGraph

var linearScaleX;						//Linearni scale pro osu X
var linearScaleY;
var graphBoxWidth = 1000;				//Sirka grafu s rodokmeny
var graphBoxHeightVertical = 800;		//Height of graph box for vertical display

/*
//Ziskani dat lokálně
d3.text("data/tracks-2015-06-25-II.txt", function(error, textString){
	parseData(textString);
	horizontal();	
	sliderManager();			
});*/

/**************************************************************
	NAČTENÍ DAT 
***************************************************************/

function readSingleFile(e) {
  	var file = e.target.files[0];
  	if (!file) {
    	return;
  	}

  	var reader = new FileReader();
  	reader.onload = function(e) {  
  		var contents = e.target.result; 

  		changeMaxTime = true; 		
  		parseData(contents);
  		horizontal();
  		sliderManager();
	};
  
  reader.readAsText(file);
}

//Reakce na nahrani souboru 
document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);


/**************************************************************
   FUNKCE NA TLACITKA
***************************************************************/	

function vertical(){
	showNoChild = false;
	displayVertical();
}

function horizontal(){	
	showNoChild = false;
	everywhereAxis = false;	
	showFrom = 0;
	showTo = maxTime;
	displayHorizontal();
}

function noChildren(){
	showNoChild = !showNoChild;
	displayHorizontal();
}

function axisEverywhere(){
	everywhereAxis = !everywhereAxis;
	displayHorizontal();
}	

function changeScales(){
	smallVisualisation = !smallVisualisation;
	if(smallVisualisation){
		scaler = 10;
		polomer = 2;
		stroke = 1;
		showLifeLengthText = false;
		
		margin = 10;
	}
	else{
		scaler = 50;
		polomer = 7;
		stroke = 3;
		showLifeLengthText = true;
		
		margin = 50;
	}
	displayHorizontal();
}

function change(){
	displayHorizontal();
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
	displayHorizontal();
}

function sortById(){
	cells.sort(function(a,b){
		var keyA = a.id;
		var keyB = b.id;
		if(keyA < keyB) return -1;
    	if(keyA > keyB) return 1;
    	return 0;     	
	})
	displayHorizontal();
}

function lifeText(){
	showLifeLengthText = !showLifeLengthText;
	displayHorizontal();
}

//Funkce, ktera vytvori Slider
function sliderManager(){

	//Vymaze predchozi slider, pokud tam je
	d3.select('#handle-one').remove();
	d3.select('#handle-two').remove();
	d3.select('#sliderRange').remove();

	//Vytvori novy slider
	d3.select('#slider').call(d3.slider().value([0,maxTime]).max(maxTime).step(1)
						.on("slide", function(evt, value){

							d3.select('#textMin').text(value[0]);
							showFrom = value[0];
							d3.select('#textMax').text(value[1]);
							showTo = value[1];
							
							d3.selectAll(".superCell").each(function(d, i){	
								
								if(this.__data__ < showFrom || this.__data__ > showTo){
									d3.select(this).classed("superCell", false);
									d3.select(this).classed("hide", true);
								}
							})

							d3.selectAll(".hide").each(function(d, i){
								if(this.__data__ >= showFrom && this.__data__ <= showTo){
									d3.select(this).classed("hide", false);
									d3.select(this).classed("superCell", true);
									
								}
							})
						}));
}

/**************************************************************
   ZÍSKÁNÍ DAT ZE SOUBORU 
***************************************************************/

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
			tmpPole.push(+tmpPromenna);								//ulozim do pole posledni hodnotu
			datacells.push(tmpPole);								//pole bunky ulozim do "datacells"
			tmpPole = [];											//vyprazdnim pomocne pole pro bunku
			tmpPromenna ="";										//vyprazdnim pomocny retezec pro promennou
		}

		else if(text[i] != " "){									//Pokud to neni mezera
			tmpPromenna += text[i]; 								//Jedna se o cifru cisla, ulozim do pomocneho retezce pro promennou
		}

		else{														//Jedna se o mezeru
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
   HORIZONTÁLNÍ VYKRESLENÍ
***************************************************************/

//Funkce, ktera zajisti, aby se vse vykreslilo Horizontalne
function displayHorizontal(){
	d3.selectAll("svg").remove();		

	var xTime = maxTime;					//maximalni doba v grafu	
	var m = 0;								//promenna pro pruchod cyklem

	linearScaleX = d3.scale.linear()								//Priprava linearScale pro osu X
						.domain([0, xTime])
						.range([0, graphBoxWidth - marginX]);
	
	//Vykresli pouze hlavni osu
	if(!everywhereAxis){
		displayXAxis(xTime);		
	}

	//Vytvori prazdny SVG, aby se to vyrovnalo
	displayBlock();

	//Vykresleni vsech bunecnych populaci
	for(m; m < cells.length; m++){
		//nastvaveni, ze se ma smazat pro pripad, ze se nevzkresli zadna bunka
		destroySVG = true;

		/*
		//Nezobrazi populace, ktere nemaji potomky	
		if(showNoChild && (cells[m].children.length == 0)){
			continue;
		}*/	

		var depth = depthFinder(cells[m]);								//zjistim hloubku populace, abych mohl spravne vetvit
		
		h = (Math.pow(2,  depth) * scaler) - margin*(depth-1) ;		//vytvoreni vysky daneho svg rodokmenu	
		
		//Vytvoreni SVG containeru
		var svgContainer = d3.select("body").select(".graphBox").append("svg")
											.attr("width", graphBoxWidth)
											.attr("height", h - margin*(depth-1));

		
		displayHorizontalPopulation(cells[m], (h - margin*(depth-1))/2, svgContainer, (h - margin*(depth-1))/4);		//zavolani funkce, ktera to vykresli	
		
		//Pokud se do svgConatineru nic nevykreslilo, smaze jej
		if(destroySVG){
			svgContainer.remove();
		} else{
			//Vykresleni vlastni osy k dane populaci
			if(everywhereAxis){
				displayEverywhereXAxis(xTime);
			}
		}
	}
	getAdditionalData(positionLine);		
}

//Funkce, ktera zjisti hloubku dane bunecne populace
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
		
		//spoji start a end body			
		var superLine = superCell.append("line")			
							.on("mouseover", function() {							//Zmena barvy po najeti na prvek			
        						d3.select(this).classed("hover", true);
      						})
    						.on("mouseout", function() {
         						d3.select(this).classed("hover", false);
    						})
    						.on("click", function(){								//Po kliknuti se zobrazi info o bunce
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "10px")
    													.html("Cell : " + cell.id + "<br/>Lifetime: " + (cell.end - cell.begin))
    						})
							.attr("x1", linearScaleX(cell.begin) + marginX/2)
							.attr("y1", positionY)
							.attr("x2", linearScaleX(cell.end) + marginX/2)
							.attr("y2", positionY)
							.attr("stroke-width", stroke)
                        	.attr("stroke", "black"); 

        //Vykresleni doby zivota
        if(showLifeLengthText){
        	var timeDisplay = superCell.append("text")
    							.text(cell.end - cell.begin)
    							.attr("x", linearScaleX((cell.end - cell.begin)/2 + cell.begin))
    							.attr("y", positionY - 10)
    							.attr("font-family", "sans-serif")
   								.attr("font-size", "12px")
   								.attr("id", "life" + cell.id);  
   		}

   		//seznam potomku ve frme textu
   		var childrenText = getChildrenText(cell);

    	//vykresleni pocatecniho bodu
		var blueCircle = superCell.append("circle")
									.on("mouseover", function() {					//Zmena barvy po najeti na prvek
        									d3.select(this).classed("blueC", true);
      								})
    								.on("mouseout", function() {
         									d3.select(this).classed("blueC", false);
    								})
    								.on("click", function(){						//Po kliknuti zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Cell ID: " + cell.id + "<br/>Begin time: " + cell.begin + "<br/>Death / mitosis: " + cell.end + "<br/>Parent: " + cell.parentID + "<br/>Children: " + childrenText)
    								})
									.attr("cx", linearScaleX(cell.begin) + marginX/2)
									.attr("cy", positionY)
			   						.attr("r", polomer)
			   						.attr("fill", "blue");
			   								
		//vykresleni ID bunky u pocatecniho bodu
		if(!smallVisualisation){			
			var description = superCell.append("text")
									.text(cell.id)
			   						.attr("x", linearScaleX(cell.begin) + 2)
			   						.attr("y", positionY+2)
			   						.attr("font-family", "sans-serif")
   									.attr("font-size", textHeight)
   									.attr("fill", "red");
   		}
 	}
   			
   	if(cell.children.length != 0){											//pokud ma bunka potomky, vykreslim je 				
		if(shown){							//Pokud se vykreslila aktuani bunka, spojim	s potomky
			if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){		
				connectParentChild(positionY, cell, superCell, -repairer);
			}
		}
			
		if(cell.children.length == 1){				
			displayHorizontalPopulation(cell.children[0], positionY - repairer, container, repairer/2);			
		} else{
			if(shown){
				if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
					connectParentChild(positionY, cell, superCell, repairer);
				}
			}
			displayHorizontalPopulation(cell.children[0], positionY - repairer, container, repairer/2);
			displayHorizontalPopulation(cell.children[1], positionY + repairer, container, repairer/2);
		}

		if(shown){
			//vykresleni mitotickeho deleni
			var greenCircle = superCell.append("circle")
								.on("mouseover", function() {				//Zmena barvy po najeti na prvek
        								d3.select(this).classed("greenC", true);
      							})
    							.on("mouseout", function() {
         								d3.select(this).classed("greenC", false);
    							})	
    							.on("click", function(){					//Po kliknuti se zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Mitotis of cell: " + cell.id + "<br/>Time: " + cell.end + "<br/>New cells: " + childrenText)
    							})							
								.attr("cx", linearScaleX(cell.end) + marginX/2)
								.attr("cy", positionY)
			   					.attr("r", polomer)
			   					.attr("fill", "green")
			   					.append("title")
			   					.text(function(d){
			   						return "MITOSIS"
			   					});
			}
	  } else{	
   			if(cell.begin >= showFrom && cell.begin <= showTo){
   			//vykresleni smrti bunky
   				if(cell.end != maxTime){	
					var redCircle = superCell.append("circle")
						.on("mouseover", function() {					//Zmena barvy po najeti na prvek
        						d3.select(this).classed("redC", true);
      					})
    					.on("mouseout", function() {
         						d3.select(this).classed("redC", false);
    					})
    					.on("click", function(){			//Po klinuti se zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Death: " + cell.id + "<br/>Time: " + cell.end)
    					})
						.attr("cx", linearScaleX(cell.end) + marginX/2)
						.attr("cy", positionY)
			   			.attr("r", polomer)
			   			.attr("fill", "#993333")
			   			.append("title")
			   			.text(function(d){
			   				return "DEATH"
			   			});
			   	}
		}
   	} 
}  

//Vytvori maly prazdny svg blok
function displayBlock(){
	var svgBlok = d3.select("body").select(".graphBox").append("svg")
									.attr("width", graphBoxWidth)
									.attr("height", 60);											
}

//Funkce, ktera vykresli hlavni osu X
//@param	xTime	celkova doba (tzn. jak siroka ma osa byt)
function displayXAxis(xTime){

	//Scale pro osu
	var xScale = d3.scale.linear()
						.domain([0, xTime])
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
										line(Math.round(lineScaler(d3.mouse(this)[0] - marginX/2 + 2)), svgAxis);
	});

	//variables for axis
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(30);

	svgAxis.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+ marginX/2 + "," + 5 + ")")
			.call(xAxis);

	//Attach line of position in the axisGraph
	svgAxis.append("line")
			.attr("x1", linearScaleX(0) + marginX/2)	
			.attr("y1", 5)
			.attr("x2", linearScaleX(0) + marginX/2)
			.attr("y2", 1000)
			.attr("stroke-width", 1)
			.attr("stroke", "purple")
			.attr("id", "movingLine");
}

//Function, which will change the position of the line in axis graph
//@param 	position 	new position in the graph
//@param 	svgAxis		axisGraph where the line is 
function line(position, svgAxis){
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
function displayEverywhereXAxis(xTime){
	var xScale = d3.scale.linear()
						.domain([0, xTime])
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
		return "" + parent.children[0].id + " a " + parent.children[1].id;
	}
	else{
		return "None";
	}
}

//Funkce, ktera vytvori linku spoje mezi bodem mitotickeho deleni a nove vyniklou bunkou
//@param	positionY	pozice vykresleni na ose Y
//@param 	cell 		bunka, ze ktere vznikly nove bunky
//@param	container 	svg, do ktereho linku vlozit
//@param	repairer	Y souradnice konce linky
function connectParentChild(positionY, cell, container, repairer){
	var anotherLine = container.append("line")
									.on("mouseover", function() {
        								d3.select(this).classed("hover", true);
      								})
    								.on("mouseout", function() {
         								d3.select(this).classed("hover", false);
    								})
									.attr("x1", linearScaleX(cell.end) + marginX/2)
									.attr("y1", positionY)
									.attr("x2", linearScaleX(cell.end + 1) + marginX/2)
									.attr("y2", positionY + repairer)
									.attr("stroke-width", stroke)
                        			.attr("stroke", "black");
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
	else if((position > cell.begin) && (position < cell.end)){	
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

	var datas = [begin, death, mitosis, lifeGraphCells.length];		//info about possible states
	var description = ["BEGIN", "DEATH", "MITOSIS", "ALIVE"];
	var colors = ["blue", "red", "green", "black"];

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
			.attr("width", 5 * datas[i])
			.attr("height", 20)
			.attr("fill", colors[i])

		life.append("text")
				.text(datas[i])
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

	/*
	life.append("rect")			
			.attr("x", 25 + margLife + posunuti)
			.attr("y", 80)
			.attr("width", 5 * datas[3])
			.attr("height", 20)		
			.attr("fill", colors[3]);

	life.append("text")
			.text(datas[3])
			.attr("x", posunuti + margLife)
			.attr("y", (3 * 25) + 20)
			.attr("font-family", "sans-serif")
			.attr("font-size", 15)
			.attr("fill", "black");	

	life.append("text")
				.text(description[3])
				.attr("x", 5)
				.attr("y", (3 * 25) + 20)
				.attr("font-family", "sans-serif")
				.attr("font-size", 15)
				.attr("fill", "black");	
	*/

	//Display life Graph of living cells
	d3.select('#deleteLife').remove();
	if(lifeGraphCells.length != 0){
		displayLifeGraph();
	}
}

//Function will display life graph of Living cells in certain time
function displayLifeGraph(){
	var c = 0;
	var lifeLinearX = d3.scale.linear().domain([0, maxTime]).range([0, 310]);
	var lifeLinearY = d3.scale.linear().domain([0, 900]).range([0, 600]);	

	var lifeGraph = d3.select("body").select(".lifeGraph").append("svg")
						.attr("height",  700)
						.attr("class", "lifeGraph")
						.attr("id", "deleteLife");

	//we will display life of every living cell (array of lifeGraphCells)
	for(c; c < lifeGraphCells.length; c++){
		var lifeContainer = lifeGraph.append("g").attr("class", "cellLife");

		var idText = lifeContainer.append("text")
										.text(lifeGraphCells[c].id + ": ")
										.attr("x", 5)
			   							.attr("y", lifeLinearY(c * 20 + 5) +20)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight);

		var lifeLine = lifeContainer.append("line")
						.attr("x1", function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y1", function(){
							return lifeLinearY(c * 20 + 5) + 15;
						})
						.attr("x2", function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y2", function(){
							return lifeLinearY(c * 20 + 5) +15;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");

		var lifeBegin = lifeContainer.append("line")
						.attr("x1",function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y1", function(){
							return lifeLinearY(c * 20 + 5) +10;
						})
						.attr("x2",function(){
							return lifeLinearX(lifeGraphCells[c].begin) + 20 + margLife;
						})
						.attr("y2", function(){
							return lifeLinearY(c * 20 + 5) +20;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");

		var lifeBeginText = lifeContainer.append("text")
										.text(lifeGraphCells[c].begin)
										.attr("x", lifeLinearX(lifeGraphCells[c].begin) - 5 + margLife)
			   							.attr("y", lifeLinearY(c * 20 + 5) +20)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight);

		var lifeEnd = lifeContainer.append("line")
						.attr("x1",function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y1", function(){
							return lifeLinearY(c * 20 + 5) +10;
						})
						.attr("x2",function(){
							return lifeLinearX(lifeGraphCells[c].end) +20 + margLife;
						})
						.attr("y2", function(){
							return lifeLinearY(c * 20 + 5) +20;
						})
						.attr("stroke-width", 1)
						.attr("stroke", "black");	

		var lifeEndText = lifeContainer.append("text")
										.text(lifeGraphCells[c].end)
										.attr("x", lifeLinearX(lifeGraphCells[c].end) + 25 + margLife)
			   							.attr("y", lifeLinearY(c * 20 + 5) +20)
			   							.attr("font-family", "sans-serif")
   										.attr("font-size", textHeight);	
	}

	var wholeLine = lifeContainer.append("line")
							.attr("x1", function(){
								return lifeLinearX(positionLine) + 20 + margLife;
							})
							.attr("y", function(){return lifeLinearY(0);})
							.attr("x2", function(){return lifeLinearX(positionLine) + 20 + margLife;})
							.attr("y2", function(){return lifeLinearY(1200);})
							.attr("stroke-width", 1)
							.attr("stroke", "purple");
}


/**************************************************************
   VERTIKALNI ZOBRAZENI
***************************************************************/

//Vertikalni zobrazeni / bude treba jeste cele predelat
function displayVertical(){	
	d3.selectAll("svg").remove();
	displayBlock();	

	var m = 0;

	linearScaleY = d3.scale.linear()							//scaler for vertical display
						 .domain([0, maxTime])
						 .range([0, graphBoxHeightVertical - marginX]);	

	for(m; m < cells.length; m++){	
		destroySVG = true;

		var depth = depthFinder(cells[m]);	

		w = Math.pow(2,  depth) * scaler - margin*(depth-1);			//vytvoreni sirky daneho svg rodokmenu					

		//Vytvoreni SVG containeru
		var svgContainer = d3.select("body").append("svg")
											.attr("width", w - margin*(depth-1))
											.attr("height", graphBoxHeightVertical);

		displayPopulationV(cells[m], (w - margin*(depth-1))/2 , svgContainer, (w - margin*(depth-1))/4);		//zavolani funkce, ktera to vykresli
		
		if(destroySVG){
			svgContainer.remove();
		}
		/*	
		//promenne pro osy
		var yAxis = d3.svg.axis()
						  .scale(yScale)
						  .orient("right")
						  .ticks(30);
				
		//vykresleni x osy
		svgContainer.append("g")
					.attr("class", "axis")
					.attr("transform", "translate("+ (w - 20) +"," + margin/2 +")")
					.call(yAxis);
		*/
		getAdditionalData(positionLine);
	}
}

function displayPopulationV(cell, positionX, container, repairer){
	var shown = false;
	var superCell = container.append("g").classed("superCell", true).datum(cell.begin);
	
	if((cell.begin >= showFrom) && (cell.begin <= showTo)){
		destroySVG = false;
		shown = true;

		//spoji start a end body
		var superLine = superCell.append("line")
							.on("mouseover", function() {
        						d3.select(this).classed("hover", true);
      						})
    						.on("mouseout", function() {
         						d3.select(this).classed("hover", false);
    						})
							.attr("x1", positionX)
							.attr("y1", linearScaleY(cell.begin) + marginX/2)
							.attr("x2", positionX)
							.attr("y2", linearScaleY(cell.end) + marginX/2)
							.attr("stroke-width", stroke)
                        	.attr("stroke", "black");

        if(showLifeLengthText){
        	var timeDisplay = superCell.append("text")
        						.text(cell.end - cell.begin)
    							.attr("x", positionX + 5)
    							.attr("y", linearScaleY((cell.end - cell.begin)/2) + cell.begin)
    							.attr("font-family", "sans-serif")
   								.attr("font-size", "12px")
   								.attr("id", "life" + cell.id);  
   		}

   		//seznam potomku ve frme textu
   		var childrenText = getChildrenText(cell);

   		//vykresleni pocatecniho bodu
		var blueCircle = superCell.append("circle")
									.on("mouseover", function() {
        									d3.select(this).classed("blueC", true);
      								})
    								.on("mouseout", function() {
         									d3.select(this).classed("blueC", false);
    								})
    								.on("click", function(){						//Po kliknuti zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Cell ID: " + cell.id + "<br/>Begin time: " + cell.begin + "<br/>Death / mitosis: " + cell.end + "<br/>Parent: " + cell.parentID + "<br/>Children: " + childrenText)
    								})
									.attr("cx", positionX)
									.attr("cy", linearScaleY(cell.begin)+ margin/2)
			   						.attr("r", polomer)
			   						.attr("fill", "blue");

		if(!smallVisualisation){
		//vykresleni ID bunky u pocatecniho bodu
			var description = superCell.append("text")
									.text(cell.id)
			   						.attr("x", positionX + 2)
			   						.attr("y", linearScaleY(cell.begin) + 2)
			   						.attr("font-family", "sans-serif")
   									.attr("font-size", "10px")
   									.attr("fill", "red");
   		}
	}

	if(cell.children.length != 0){
		if(shown){
			if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
				connectParentChildVertical(positionX, cell, superCell, -repairer);
			}
		}

		if(cell.children.length == 1){
			displayPopulationV(cell.children[0], positionY - repairer, container, repairer/2);
		} else{
			if(shown){
				if(cell.children[0].begin >= showFrom && cell.children[0].begin <= showTo){
					connectParentChildVertical(positionX, cell, superCell, repairer);
				}
			}
			displayPopulationV(cell.children[0], positionX - repairer, container, repairer/2);
			displayPopulationV(cell.children[1], positionX + repairer, container, repairer/2);
		}

		if(shown){
			//vykresleni mitotickeho deleni
			var greenCircle = superCell.append("circle")
									.on("mouseover", function() {
        									d3.select(this).classed("greenC", true);
      								})
    								.on("mouseout", function() {
         									d3.select(this).classed("greenC", false);
    								})	
    								.on("click", function(){					//Po kliknuti se zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Mitotis of cell: " + cell.id + "<br/>Time: " + cell.end + "<br/>New cells: " + childrenText)
    								})								
									.attr("cx", positionX)
									.attr("cy", linearScaleY(cell.end) + margin/2)
			   						.attr("r", polomer)
			   						.attr("fill", "green")
			   						.append("title")
			   						.text(function(d){
			   							return "MITOTICKE DELENI"
			   						});

		}

	} else{	
		if(cell.begin >= showFrom && cell.begin <= showTo){
   			//vykresleni smrti bunky	
			var redCircle = superCell.append("circle")
							.on("mouseover", function() {
        							d3.select(this).classed("redC", true);
      						})
    						.on("mouseout", function() {
         							d3.select(this).classed("redC", false);
    						})
    						.on("click", function(){			//Po klinuti se zobrazi info
    									d3.select("body").select(".cellInfo").selectAll("text").remove();
    									d3.select("body").select(".cellInfo").append("text").attr("font-size", "12px")
    													.html("Death: " + cell.id + "<br/>Time: " + cell.end)
    						})
							.attr("cx", positionX)
							.attr("cy", linearScaleY(cell.end) + margin/2)
			   				.attr("r", polomer)
			   				.attr("fill", "#993333")
			   				.append("title")
			   				.text(function(d){
			   					return "UMRTI"
			   				});
		}


	}
}

//Funkce, ktera vytvori linku spoje mezi bodem mitotickeho deleni a nove vyniklou bunkou
//@param	positionY	pozice vykresleni na ose Y
//@param 	cell 		bunka, ze ktere vznikly nove bunky
//@param	container 	svg, do ktereho linku vlozit
//@param	repairer	Y souradnice konce linky
function connectParentChildVertical(positionX, cell, container, repairer){
	var anotherLine = container.append("line")
									.on("mouseover", function() {
        								d3.select(this).classed("hover", true);
      								})
    								.on("mouseout", function() {
         								d3.select(this).classed("hover", false);
    								})
									.attr("x1", positionX)
									.attr("y1", linearScaleY(cell.end) + marginX/2)
									.attr("x2", positionX + repairer)
									.attr("y2", linearScaleY(cell.end + 1) + marginX/2)
									.attr("stroke-width", stroke)
                        			.attr("stroke", "black");
}