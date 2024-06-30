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

	static doNotIndex = false;

	export() {
		return {
			"name": this.name,
			"class": this.constructor.name,
			"position": {
				"x": this.position.x,
				"y": this.position.y
			}
		};
	}	

	remove() {
		for (var pin of this.getPins())
			pin.disconnect();
		this.parent._freeIndex(this.name);
		super.remove();
	}
	
	place() {
		for (var pin of this.getPins()) 
			pin.place();
	}

	getCircuit() {
		return this.parent.parent;
	}

	getPins() {
		return this.children.pins.children;
	}

	getPinByName(name) {
		return this.children.pins.children[name];
	}

	createPackage(point, packageData, circuit) {

		var gridSize = circuit.appearance.size.grid;
		var origin = new Point(
			point.x - packageData.body.origin.x*gridSize, 
			point.y - packageData.body.origin.y*gridSize
		);

		var body = new CompoundPath();
		body.position = origin;
		if (!packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.fillBodyDefault(body, packageData, origin, gridSize);
		else // else we have custom package information, then process it
			this.fillBodyCustom(body, packageData, origin, gridSize);
		body.name = "body";
		body.data.type = "body";
		this.addChild(body);

		const pins = new Group();
		pins.name = "pins";
		this.addChild(pins);
		const bodyDimensions = packageData.body.dimensions;
		for (const pinData of packageData.pins)
		{
			pins.addChild(new Pin(circuit, pinData, bodyDimensions, origin, gridSize));
			this.lastChild
			if (pinData.bulb)
				this.addChild(pins.lastChild.getInversionBulb());
		}

		this.children.pins.sendToBack();

		this.setStrokeColor(circuit.appearance.color.devices);
		this.setStrokeWidth(circuit.appearance.size.device);
		this.setFillColor(circuit.appearance.color.fill);

	}

	fillBodyDefault(body, packageData, origin, gridSize) {
		var outline = new Path.Rectangle(
			origin.x,
			origin.y,
			packageData.body.dimensions.width*gridSize,
			packageData.body.dimensions.height*gridSize
			);
		outline.data.type = "bodyPart";
		body.addChild(outline);
	}

	fillBodyCustom(body, packageData, origin, gridSize) {
		
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
			piece.data.type = "bodyPart";
			body.addChild(piece);
		}
	}

	pointFromPackageNotation(pdn, gridSize) {
		return new Point(pdn[0], pdn[1]).multiply(gridSize);
	}

	mode(pinName, mode) {
		return this.children.pins.children[pinName].mode = mode;
	}

	setState(pinName, state) {
		return this.children.pins.children[pinName].state = state;
	}

	read(pinName) {
		return this.children.pins.children[pinName].get();
	}

	write(pinName, state) {
		this.children.pins.children[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.children.pins.children[pinName].state == undefined)
 			return;
 		this.children.pins.children[pinName].set(!this.children.pins.children[pinName].get());
 	}

 	act(actuator) { // fires when the item's actuator has been pressed
 		return;
 	}

	update() { // updates the device's outputs based on its inputs
		return;
	}

	reset() {
		for (var p of this.children["pins"].children)
				p.set(p.initial);
	}

	recolor(color) {
		this.strokeColor = color;
	}
}
