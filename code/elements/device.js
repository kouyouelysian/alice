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
	},

	Templates: { /* templates added here later */ }

	/* other devices from /code/devices/* added here as to a dict  */
}

Devices.Device = class Device extends Group {

	constructor(circuit, point, packageData=Devices.defaultPackageData) {

		super();

		this.position = point;		
		this.name = window.sim.circuit.rollByPrefix("name", (this.constructor.name || "dev"));
		circuit.children.devices.addChild(this);
		this.data.type = "device"; 
		this.options = {
			/* option": {"type":"int", "value":"1"} */
		};
		this.pivot = this.bounds.topLeft;
		this.createPackage(point, packageData, circuit);
	}	

	static doNotIndex = false;

	static category = {"name":null, "object":null};

	get body() {
		return this.children.body;
	}

	get pins() {
		return this.children.pins;
	}

	get labels() {
		return this.children.labels;
	}

	get fullClass() {
		return `${this.constructor.category.name}.${this.constructor.name}`
	}

	export() {
		var json = {
			"name": this.name,
			"class": this.fullClass,
			"position": {
				"x": this.position.x,
				"y": this.position.y
			}
		};
		if (this.options != {})
			json.options = this.options;
		return json;
	}	

	remove() {
		for (var pin of this.getPins())
			pin.disconnect();
		this.parent.freeIndex(this.name);
		super.remove();
	}
	
	place() {
		for (var pin of this.getPins()) 
			pin.place();
	}

	reload() {
		// for devices with options - apply options here
	}

	getCircuit() {
		return this.parent.parent;
	}

	getPins() {
		return this.pins.children;
	}

	getPinByName(name) {
		return this.pins.children[name];
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

		const labels = new Group();
		labels.name = "labels";
		this.addChild(labels);

		const bodyDimensions = packageData.body.dimensions;
		for (const pinData of packageData.pins)
		{
			pins.addChild(new Pin(circuit, pinData, bodyDimensions, origin, gridSize));
			this.lastChild
			if (pinData.bulb)
			{
				var bulb = pins.lastChild.getInversionBulb();
				this.body.addChild(bulb);
				bulb.bringToFront();
			}
			if (pinData.label)
				this.children.labels.addChild(pins.lastChild.getLabel());
		}

		this.pins.sendToBack();
		this.children.labels.bringToFront();

		this.body.setStrokeColor(circuit.appearance.color.devices);
		this.body.setStrokeWidth(circuit.appearance.size.device);
		this.body.setFillColor(circuit.appearance.color.fill);
		

		

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

	deleteBody() {
		this.children.body.removeChildren();
	}

	pointFromPackageNotation(pdn, gridSize) {
		return new Point(pdn[0], pdn[1]).multiply(gridSize);
	}

	mode(pinName, mode) {
		this.pins.children[pinName].mode = mode;
		if (mode != "output")
			this.pins.children[pinName].set(undefined);
		return;
	}

	label(pinName, label=null) {
		return this.pins.children[pinName].label = label;
	}

	setState(pinName, state) {
		return this.pins.children[pinName].state = state;
	}

	read(pinName) {
		return this.pins.children[pinName].get();
	}

	write(pinName, state) {
		return this.pins.children[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.pins.children[pinName].state == undefined)
 			return;
 		this.pins.children[pinName].set(!this.pins.children[pinName].get());
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
