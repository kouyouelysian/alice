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

	static packageData = Devices.defaultPackageData;

	constructor(circuit, point) {
		super();
		this.name = window.sim.circuit.rollByPrefix("name", (this.constructor.name || "dev"));
		circuit.children.devices.addChild(this);
		this.data.type = "device"; 
		this.options = {
			/* option": {"type":"int", "value":"1"} */
		};

		this.position = point;
		this.orientation = 0; // direction. "rotation" is taken by paperjs
		this.createChildren();
		console.log(this, this.children);
		this.createPackage(point, circuit);
	}	

	createChildren() {
		var body = new CompoundPath();
		body.name = "body";
		body.data.type = "body";
		this.addChild(body);

		var pins = new Group();
		pins.name = "pins";
		this.addChild(pins);

		const bulbs = new Group();
		bulbs.name = "bulbs";
		bulbs.data.type = "body";
		this.addChild(bulbs);

		const labels = new Group();
		labels.name = "labels";
		this.addChild(labels);

		
		body.sendToBack();
		pins.sendToBack();
		bulbs.bringToFront();
		labels.bringToFront();
	}

	static doNotIndex = false;

	static category = {"name":null, "object":null};

	get packageData() {
		console.log(this.fullClass);
		return eval(`Devices.${this.fullClass}.packageData`);
	}

	get body() {
		return this.children.body;
	}

	get pins() {
		return this.children.pins.children;
	}

	get labels() {
		return this.children.labels.children;
	}

	get circuit() {
		return this.parent.parent;
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
		for (var pin of this.pins)
			pin.disconnect();
		this.parent.freeIndex(this.name);
		super.remove();
	}
	
	place() {
		for (var pin of this.pins) 
			pin.place();
	}

	reload() {
		// for devices with options - apply options here
	}

	createPackage(point, circuit, rotation=0) {

		var gridSize = window.sim.appearance.size.grid;

		var origin = new Point(
			point.x - this.packageData.body.origin.x*gridSize, 
			point.y - this.packageData.body.origin.y*gridSize
		);
		
		if (!this.packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.fillBodyDefault(this.body, origin, gridSize, rotation);
		else // else we have custom package information, then process it
			this.fillBodyCustom(this.body, origin, gridSize,rotation);
		
		const bodyDimensions = this.packageData.body.dimensions;

		for (const pinData of this.packageData.pins)
		{
			pinData.side = (pinData.side + rotation) % 4;
			this.children.pins.addChild(new Pin(circuit, pinData, bodyDimensions, origin, gridSize));
			this.lastChild
			if (pinData.bulb)
			{
				var bulb = this.children.pins.lastChild.getInversionBulb();
				this.body.addChild(bulb);
				bulb.bringToFront();
			}
			if (pinData.label)
				this.children.labels.addChild(this.children.pins.lastChild.getLabel());
		}


		this.body.setStrokeColor(window.sim.appearance.color.devices);
		this.body.setStrokeWidth(window.sim.appearance.size.device);
		this.body.setFillColor(window.sim.appearance.color.fill);
	}


	fillBodyDefault(body, origin, gridSize, rotation) {
		var outline = new Path.Rectangle(
			origin.x,
			origin.y,
			this.packageData.body.dimensions.width*gridSize,
			this.packageData.body.dimensions.height*gridSize
			);
		outline.data.type = "bodyPart";
		body.addChild(outline);
	}

	fillBodyCustom(body, origin, gridSize, rotation) {
		console.log("asdf", origin);
		for (var pieceData of this.packageData.body.symbol)
		{
			var piece = new Path();
			for (var segment of pieceData.segmentData)
			{
				var point = this.pointFromPackageNotation(segment.point, gridSize, rotation);
				piece.add(origin.add(point));
				if (segment.handles)
				{
					piece.lastSegment.handleIn = this.pointFromPackageNotation(segment.handles.in, gridSize, rotation, point);
					piece.lastSegment.handleOut = this.pointFromPackageNotation(segment.handles.out, gridSize, rotation, point);
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

	deletePackage() {
		this.deleteBody();
		this.deletePins();
	}

	deletePins() {
		this.children.pins.removeChildren();
		this.children.pins.remove();	
	}

	deleteBody() {
		this.children.body.removeChildren();
	}

	pointFromPackageNotation(pdn, gridSize, rotation, rotationOrigin=new Point(0,0)) {
		var p = new Point(pdn[0], pdn[1]).multiply(gridSize);
		if (rotation !== null)
			p = p.rotate(rotation*-90, rotationOrigin);
		return p;

	}

	mode(pinName, mode) {
		this.pins[pinName].mode = mode;
		if (mode != "output")
			this.pins[pinName].set(undefined);
		return;
	}

	label(pinName, label=null) {
		return this.pins[pinName].label = label;
	}

	setState(pinName, state) {
		return this.pins[pinName].state = state;
	}

	read(pinName) {
		return this.pins[pinName].get();
	}

	write(pinName, state) {
		return this.pins[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.pins[pinName].state == undefined)
 			return;
 		this.pins[pinName].set(!this.pins[pinName].get());
 	}

 	act(actuator) { // fires when the item's actuator has been pressed
 		return;
 	}

	update() { // updates the device's outputs based on its inputs
		return;
	}

	reset() {
		for (var p of this.pins)
				p.set(p.initial);
	}

	recolor(color) {
		this.strokeColor = color;
	}

	reorient(orientation = (this.orientation+1)%4) {
		this.orientation = orientation;
	}


}
