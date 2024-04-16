


function setupTool() {

	var tool = new Tool();
	tool.minDistnace = 4;
	tool.onMouseMove = function(event) {

		const quantizedPoint = new Point(
			event.point.x,
			event.point.y
			);

		quantizedPoint.quantize(project.layers.editables.data.style.size.grid);
		
		if (!window.circuit.gridCursor.position.isClose(quantizedPoint, 1)) {
			window.circuit.gridCursor.position = quantizedPoint;
			window.circuit.point(event.point, quantizedPoint);
		}
		
		if (window.circuit.status == "net") {
			var wire = window.circuit.wireDragged;
			wire.lastSegment.point = event.point;
		}	
		else if (window.circuit.status == "device" && window.circuit.devicePicked != null) {
			window.circuit.devicePicked.position = quantizedPoint;
		}
		
	}

	tool.onKeyDown = function(event) {	
		window.circuit.keyboard(event.key);
	}
	return tool;
}





window.onload = function() {
{		
	window.circuit = new Circuit(GLOBAL_sizing);
	setupTool();
	document.getElementById('simCanvas').scrollIntoView({
		block: 'center',
		inline: 'center',
		behavior: 'auto'
	}); 

}}
