var Devices = {

	defaultPackageData: {
		"pins": [
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

	defaultActions: [
		{"name":"rotate", "method":"reorient"},
		{"name":"delete", "method":"remove"}
	],

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
		/*
		
		this.createBody(point, circuit);
		this.createPins(circuit);
		*/
		this.reposition(point);

	}	

	static doNotIndex = false;

	static category = {"name":null, "object":null};

	get packageData() {
		return eval(`Devices.${this.fullClass}.packageData`);
	}

	get originRelative() {
		var x = this.packageData.body.origin.x;
		var y = this.packageData.body.origin.y;
		var w = this.packageData.body.dimensions.width;
		var h = this.packageData.body.dimensions.height;
		var a = [x, y, w-x, h-y, x];
		return new Point(a[this.orientation]*window.sim.grid, a[this.orientation+1]*window.sim.grid);		
	}

	get originAbsolute() {
		return this.position.add(this.originRelative);
	}

	get positionNext() {
		var a = this.corner.topRight.subtract(this.originAbsolute);
		return this.originAbsolute.add(new Point(a.y, a.x*-1));

	}

	get corner() {

		// percepted width/height
		var pw = this.packageData.body.dimensions.width;
		var ph = this.packageData.body.dimensions.height;
		if (this.orientation % 2 == 1)
			[pw, ph] = [ph, pw] 

		return {
			"topRight": this.position.add(new Point(pw*window.sim.grid,0)),
			"topLeft": this.position,
			"bottomLeft": this.position.add(new Point(0,ph*window.sim.grid)),
			"bottomRight": this.position.add(new Point(pw*window.sim.grid, ph.height*window.sim.grid))
		}
	}

	get body() {
		return this.children.body;
	}

	get actuators() {
		return this.children.actuators.children;
	}

	get decorations() {
		return this.children.decorations.children;
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

	createChildren() {
		var childDescriptions = [
			["body", CompoundPath, true],
			["pins", Group, false],
			["bulbs", CompoundPath, true],
			["labels", Group, false],
			["decorations", Group, false],
			["actuators", Group, false],
		];
		for (var cd of childDescriptions)
		{
			var child = new cd[1];
			child.name = cd[0];
			if (cd[2])
				child.data.type = "body";
			this.addChild(child);
			this.propagateVisualAttributes(child);
			child.bringToFront();
		}
	}

	propagateVisualAttributes(obj) {
		obj.setStrokeColor(window.sim.appearance.color.devices);
		obj.setStrokeWidth(window.sim.appearance.size.device);
		obj.setFillColor(window.sim.appearance.color.fill);
	}
	
	place() {
		for (var pin of this.pins) 
			pin.place();
	}

	reload() {
		// for devices with options - apply options here
	}

	createPackage(point=this.originAbsolute, circuit=this.circuit) {
		this.createBody(point, circuit);
		this.createPins(point);
	}

	deletePackage() {
		this.deleteBody();
		this.deletePins();
		this.deleteActuators();
		this.deleteDecorations();
	}

	recreatePackage() {
		this.deletePackage();
		this.createPackage();
	}

	createBody(point, circuit=this.circuit) {
		if (!this.packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.fillBodyDefault();
		else // else we have custom package information, then process it
			this.fillBodyCustom();
	}

	deleteBody() {
		this.children.body.removeChildren();
	}

	createPins(circuit=this.circuit) {
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

	deletePins() {
		this.children.pins.removeChildren();
		this.children.bulbs.removeChildren();	
		this.children.labels.removeChildren();
	}

	deleteActuators() {
		this.children.actuators.removeChildren();
	}

	deleteDecorations() {
		this.children.decorations.removeChildren();
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
	/* ????
	setState(pinName, state) {
		return this.pins[pinName].state = state;
	}
	*/

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

 	act(actuator) { // template, fires when the item's actuator has been pressed
 		return;
 	}

	update() { // template, updates the device's outputs based on its inputs
		return;
	}

	reset() {
		for (var p of this.pins)
				p.set(p.initial);
	}

	recolor(color) {
		this.strokeColor = color;
	}

	reorientTo(newOrientation) {
		while (this.orientation != newOrientation)
			this.reorient();		
	}

	reposition(newPoint) {
		this.setPosition(newPoint.subtract(this.originRelative));
	}

	reorient() {
		var newOrientation = (this.orientation + 1) % 4;
		this.position = this.positionNext;
		var shift = newOrientation % 2 == 0? 
			this.packageData.body.dimensions.height : this.packageData.body.dimensions.width; 
		this.rotateChild(this.body, shift);
		this.rotateChild(this.children.actuators, shift);
		this.rotateChild(this.children.decorations, shift);
		this.orientation = newOrientation;
		this.deletePins();
		this.createPins();
	}

	rotateChild(child, shift) {
		child.rotate(-90, this.corner.topRight);
		child.setPosition(child.position.subtract(
			new Point(shift*window.sim.grid,0)
		));
		
	}y
}
