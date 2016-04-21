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

											})
											.attr("class", "svgContainer")
											.attr("id", "svgContainer"+cells[m].id)
											.attr("version", 1.1)
        									.attr("xmlns", "http://www.w3.org/2000/svg");

		
		displayPopulation(cells[m], (h - margin*(depth-1))/2, svgContainer, (h - margin*(depth-1))/4);		//zavolani funkce, ktera to vykresli	
		
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

function displayPopulation(cell, positionY, container, repairer){	
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
			displayPopulation(cell.children[0], positionY - repairer, container, repairer/2);			
		} else{
			if(shown){
				if(cell.children[1].begin >= showFrom && cell.children[1].begin <= showTo){
					connectParentChild(positionY, cell, superCell, repairer, cell.children[1]);
				}
			}
			displayPopulation(cell.children[0], positionY - repairer, container, repairer/2);
			displayPopulation(cell.children[1], positionY + repairer, container, repairer/2);
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