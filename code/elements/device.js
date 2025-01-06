var Devices = {

	explorerExcludes: [
		"defaultPackageData",
		"Device",
		"Templates",
		"cornerNames",
		"defaultActions",
		"BinaryTable",
		"explorerExcludes",
		"IntegratedCircuit"
	], // use doNotIndex static if you also don't want a category included

	cornerNames: ["topRight", "topLeft", "bottomLeft", "bottomRight"],

	BinaryTable: [1,2,4,8,16,32,64,128],

	defaultPackageData: {
		"pins": [
			/* {name:"pinname", mode:"in" (out, hi-z) , side:2, offset:0}, */
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

	static memo = undefined;

	constructor(circuit=undefined, point=new Point(0,0), options=undefined) {
		super();
		
		if (circuit)
			circuit.children.devices.addChild(this);
		
		this.name = window.sim.circuit.rollByPrefix("name", (this.constructor.name || "dev"));
		this.data.type = "device"; 
		this.options = {};
		if (options)
			this.options = options;
				/* {option: {type:"int", value:"1"}, ...} */

		this.position = new Point(0,0);
		this.pivot = new Point(0,0);
		this.orientation = 0; // direction. "rotation" is taken by paperjs
		this.reposition(point);
		this.createChildren();
		this.createPackage(point, circuit);		
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
		var a = [x, y, w-x, h-y, x]; // trust me it works
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
			[pw, ph] = [ph, pw];

		return {
			"topRight": this.position.add(new Point(pw*window.sim.grid,0)),
			"topLeft": this.position,
			"bottomLeft": this.position.add(new Point(0,ph*window.sim.grid)),
			"bottomRight": this.position.add(new Point(pw*window.sim.grid, ph*window.sim.grid))
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

	get class() {
		return this.constructor.name;
	}

	get class() {
		return this.constructor.name;
	}

	get fullClass() {
		return `${this.constructor.category.name}.${this.constructor.name}`
	}

	get memo() {
		return this.constructor.memo;
	}

	export() {
		var json = {
			"name": this.name,
			"class": this.fullClass,
			"origin": {
				"x": this.originAbsolute.x,
				"y": this.originAbsolute.y
			},
			"orientation": this.orientation
		};
		if (this.options != {})
			json.options = bmco.clone(this.options);
		return json;
	}	

	import(deviceRecord) {
		this.name = deviceRecord.name;
		this.reorientTo(deviceRecord.orientation);
		if (deviceRecord.options)
		{
			this.options = deviceRecord.options;
			this.reload();
		}
	}

	remove() {
		this.deletePins();
		this.parent.freeIndex(this.name);
	
		if (this.circuit)
			Details.circuit.show(this.circuit);

		super.remove();
	}

	createChildren() {
		var childDescriptions = [
			["pins", Group, false],
			["body", CompoundPath, true],
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
	
	pick() {
		for (var pin of this.pins)
			pin.pick();
	}

	place() {
		for (var pin of this.pins) 
			pin.place();
	}

	reload() {
		// for devices with options - apply options here
		this.recreatePackage();
	}

	createPackage(point=this.originAbsolute, circuit=this.circuit) {
		if ((circuit && !circuit.isAnIC) || (!circuit))
			this.createBody(point, circuit); // if main window or ic editor
		this.createPins(circuit);
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
			var c = this.children.pins.addChild(new Pin(circuit, pinData, this));
			if (pinData.bulb)
			{
				var bulb = c.inversionBulb;
				this.children.bulbs.addChild(bulb);
				bulb.bringToFront();
			}
			if (pinData.label)
				this.children.labels.addChild(c.labelText);
		}
	}

	disconnectPins() {
		for (var pin of this.pins)
			pin.disconnect(); // because removechildren doesn't call each child's remove apparently
	}

	deletePins() {
		this.disconnectPins();
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
			piece.data.type = "bodyPart";

			for (var partData of pieceData.segmentData)
			{
				switch (Object.keys(partData)[0])
				{
					case "arc":
						var arc = this.makePartArc(partData);
						piece.segments = piece.segments.concat(arc.segments);
						arc.remove();
						break;
					case undefined:
					default:
						this.makePartPoint(partData, piece);
				}
			}

			if (pieceData.closed)
				piece.closed = true;
			if (pieceData.smooth)
				piece.smooth("continuous");
			this.body.addChild(piece);
		}
	}

	makePartPoint(partData, piece) {
		var point = this.pointFromPackageNotation(partData.point);
		piece.add(this.position.add(point));
		if (partData.handles)
		{
			piece.lastSegment.handleIn = this.pointFromPackageNotation(partData.handles.in);
			piece.lastSegment.handleOut = this.pointFromPackageNotation(partData.handles.out);
		}
	}

	makePartArc(partData, piece) {
		var arc = Path.Arc(
			this.pointFromPackageNotation(partData.arc[0]).add(this.position),
			this.pointFromPackageNotation(partData.arc[1]).add(this.position),
			this.pointFromPackageNotation(partData.arc[2]).add(this.position));
		this.propagateVisualAttributes(arc);
		arc.closed = false;
		return arc;
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

	read(pinName) {
		return this.pins[pinName].get();
	}

	write(pinName, state) {
		return this.pins[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.pins[pinName].state == undefined)
 			return undefined;
 		return this.pins[pinName].set(!this.pins[pinName].get());
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
	}
}
