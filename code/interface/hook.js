


function setupTool() {

	var tool = new Tool();
	tool.minDistnace = 4;
	tool.onMouseMove = function(event) {

		
		const quantizedPoint = new Point(
			event.point.x,
			event.point.y
			);

		quantizedPoint.quantize(window.sim.appearance.size.grid);

		if (!window.sim.cursor.position.isClose(quantizedPoint, 1)) {
			window.sim.cursor.position = quantizedPoint;
			window.sim.point(event.point, quantizedPoint);
		}

		switch (window.sim.status) {

			case "wiring":
				return window.sim.editedElement.lastSegment.point = event.point;
			case "adding device":
				return window.sim.editedElement.position = quantizedPoint;

		}

	}

	tool.onKeyDown = function(event) {	
		window.sim.key(event.key);
	}
	return tool;
}





window.onload = function() {
{		
	//window.circuit = new Circuit(GLOBAL_sizing);
	window.sim = new Sim(GLOBAL_sizing);
	setupTool();
	document.getElementById('simCanvas').scrollIntoView({
		block: 'center',
		inline: 'center',
		behavior: 'auto'
	}); 

}}
