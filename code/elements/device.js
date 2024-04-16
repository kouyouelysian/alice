var Devices = {

	defaultPackageData: {
		"pins": [
			{"name":"o", "mode":"out", "side":0, "offset":0}
		],
		"body": {
			"origin": {
				x:1,
				y:1
			},
			"dimensions": {
				"width": 2,
				"height": 2
			},
			"symbol": null,
			"label": null
		}
	}	

	/* other devices from /code/devices/* added here as to a dict  */
}

Devices.Device = class Device extends Group {

	constructor(circuit, point, packageData=Devices.defaultPackageData) {

		super();

		this.position = point;

		this.name = "dev"+circuit.children.devices._getIndex();
		circuit.children.devices.addChild(this);
		this.data.type = "device"; 

		this.pivot = this.bounds.topLeft;
		this.createPackage(point, packageData, circuit);
	}	

	place() {
		for (var ch of this.children) 
		{
			if (ch.data.type != "pin")
				continue;
			ch.place();

		}
	}

	getCircuit() {
		return this.parent.parent;
	}

	remove() {
		this.parent._freeIndex(this.name);
		super.remove();
	}
	
	createPackage(point, packageData, circuit) {

		var gridSize = circuit.appearance.size.grid;
		var origin = new Point(
			point.x - packageData.body.origin.x*gridSize, 
			point.y - packageData.body.origin.x*gridSize
		);

		const bodyDimensions = packageData.body.dimensions;
		for (const pinData of packageData.pins)
		{
			this.addChild(new Pin(circuit, pinData, bodyDimensions, origin, gridSize));
			this.lastChild
			if (pinData.bulb)
				this.addChild(this.lastChild.getInversionBulb());
		}

		if (!packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.insertChild(packageData.pins.length, this.createBodyDefault(packageData, origin, gridSize));
		else // else we have custom package information, then process it
			this.insertChild(packageData.pins.length, this.createBodyCustom(packageData, origin, gridSize));
		this.lastChild.name = "body";
		this.lastChild.type = "body";

		this.setStrokeColor(circuit.appearance.color.devices);
		this.setStrokeWidth(circuit.appearance.size.device);
		this.setFillColor(circuit.appearance.color.fill);

	}

	createBodyDefault(packageData, origin, gridSize) {
		var body = new Path.Rectangle(origin.x, origin.y, packageData.body.dimensions.width*gridSize, packageData.body.dimensions.height*gridSize)
		body.strokeColor = body.parent.strokeColor;
		return body;
	}

	createBodyCustom(packageData, origin, gridSize) {
		//body = new Path.Circle(origin, 10);

			var body = new CompoundPath();
			body.position = origin;
			
			for (var pieceData of packageData.body.symbol)
			{
				var piece = new Path();
				for (var segment of pieceData.segmentData)
				{
					var point = origin.add(this.pointFromPackageNotation(segment.point, gridSize));
					piece.add(point);
					if (segment.handles)
					{
						piece.lastSegment.handleIn = this.pointFromPackageNotation(segment.handles.in, gridSize);
						piece.lastSegment.handleOut = this.pointFromPackageNotation(segment.handles.out, gridSize);
					}
				}
				if (pieceData.closed)
					piece.closed = true;
				if (pieceData.smooth)
					piece.smooth("continuous");
				else
					piece.fillColor = "transparent";
				body.addChild(piece);
			}
			
			return body;
	}

	pointFromPackageNotation(pdn, gridSize) {
		return new Point(pdn[0], pdn[1]).multiply(gridSize);
	}

	setState(pinName, state) {
		return this.children[pinName].state = state;
	}

	read(pinName) {
		return this.children[pinName].get();
	}

	write(pinName, state) {
		this.children[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.children[pinName].state == undefined)
 			return;
 		this.children[pinName].set(!this.children[pinName].get());
 	}

 	act(actuator) { // fires when the item's actuator has been pressed
 		return;
 	}

	update() { // updates the device's outputs based on its inputs
		return;
	}
}