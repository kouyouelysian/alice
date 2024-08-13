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

		this.position = new Point(0,0);
		this.pivot = new Point(0,0)
		this.orientation = 0; // direction. "rotation" is taken by paperjs

		this.createChildren();
		this.createPackage(point, circuit);
		this.createPins(circuit);
		this.reposition(point);

	}	

	createChildren() {
		var body = new CompoundPath();
		body.name = "body";
		body.data.type = "body";
		this.addChild(body);

		var pins = new Group();
		pins.name = "pins";
		this.addChild(pins);

		var bulbs = new CompoundPath();
		bulbs.name = "bulbs";
		bulbs.data.type = "body";
		this.addChild(bulbs);

		var labels = new Group();
		labels.name = "labels";
		this.addChild(labels);

		body.sendToBack();
		pins.sendToBack();
		bulbs.bringToFront();
		labels.bringToFront();

		this.propagateVisualAttributes(body);
		this.propagateVisualAttributes(pins);
		this.propagateVisualAttributes(bulbs);
		this.propagateVisualAttributes(labels);
	}

	static doNotIndex = false;

	static category = {"name":null, "object":null};

	get packageData() {
		return eval(`Devices.${this.fullClass}.packageData`);
	}

	get originRelative() {
		var x = this.packageData.body.origin.x;
		var y = this.packageData.body.origin.y;
		return new Point(x*window.sim.grid, y*window.sim.grid);
	}

	get originAbsolute() {
		return this.position.add(this.originRelative);
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
		if (!this.packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.fillBodyDefault();
		else // else we have custom package information, then process it
			this.fillBodyCustom();
	}

	propagateVisualAttributes(obj) {
		obj.setStrokeColor(window.sim.appearance.color.devices);
		obj.setStrokeWidth(window.sim.appearance.size.device);
		obj.setFillColor(window.sim.appearance.color.fill);
	}

	createPins(circuit) {
		for (const pinData of this.packageData.pins)
		{
			this.children.pins.addChild(new Pin(circuit, pinData, this));
			if (pinData.bulb)
			{
				var bulb = this.children.pins.lastChild.getInversionBulb();
				this.children.bulbs.addChild(bulb);
				bulb.bringToFront();
			}
			if (pinData.label)
				this.children.labels.addChild(this.children.pins.lastChild.getLabel());
		}
	}

	recreatePins() {
		this.children.pins.removeChildren();
		this.children.bulbs.removeChildren();
		this.createPins(this.circuit);
	}

	fillBodyDefault() {
		var outline = new Path.Rectangle(
			this.position.x,
			this.position.y,
			this.packageData.body.dimensions.width*window.sim.grid,
			this.packageData.body.dimensions.height*window.sim.grid
			);
		outline.data.type = "bodyPart";
		this.body.addChild(outline);
	}

	fillBodyCustom() {
		for (var pieceData of this.packageData.body.symbol)
		{
			var piece = new Path();
			for (var segment of pieceData.segmentData)
			{
				var point = this.pointFromPackageNotation(segment.point);
				piece.add(this.position.add(point));
				if (segment.handles)
				{
					piece.lastSegment.handleIn = this.pointFromPackageNotation(segment.handles.in);
					piece.lastSegment.handleOut = this.pointFromPackageNotation(segment.handles.out);
				}
			}
			if (pieceData.closed)
				piece.closed = true;
			if (pieceData.smooth)
				piece.smooth("continuous");
			else
				piece.fillColor = "transparent";
			piece.data.type = "bodyPart";
			this.body.addChild(piece);
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

	pointFromPackageNotation(pdn) {
		var p = new Point(pdn[0], pdn[1]).multiply(window.sim.grid);
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

	reorient(newOrientation = (this.orientation+1)%4) {
		for (var x = this.orientation; x != newOrientation; x = (x+1)%4)
			this.body.rotate(-90, this.originAbsolute);
		this.orientation = newOrientation;
		this.recreatePins();
	}

	reposition(newPoint) {
		this.setPosition(newPoint.subtract(this.originRelative));
	}

}
