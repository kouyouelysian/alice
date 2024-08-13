Devices.Interfaces = {};

Devices.Interfaces.Source = class Source extends Devices.Device {

	static packageData = JSON.parse(JSON.stringify(Devices.defaultPackageData));

	constructor(circuit, point) {
		super(circuit, point);
		this.options = {
			buttons: {"type":"qty", "value":1},
			style: {"type":"choice", "choices":["full","compact"], "value":"full"}
		};		
		this.createButtons(point);
	}

	get packageData() {
		var pd = JSON.parse(JSON.stringify(Devices.Interfaces.Source.packageData));
		pd.pins = [this.makePinData(0)];
		if (this.options.buttons && this.options.style)
		{
			var step = this.options.style.value=="compact"? 1 : 2;
			pd.body.dimensions.height = 2 + (this.options.buttons.value - 1) * step;
			for (var x = 1; x < this.options.buttons.value; x++)
				pd.pins.push(this.makePinData(x, step));
		}
		return pd;
	}

	makePinData(x, step=2) {
		return {"name":`o${x}`, "mode":"out", "side":0, "offset":x*step, "initial":false}
	}

	reload() {
		var o = this.orientation.valueOf();
		this.reorientTo(0)
		this.recreatePackage();
		this.createButtons(this.originAbsolute);
		this.reorientTo(o);
	}

	createButtons(point) {
		for (var x = 0; x < this.options.buttons.value; x++)
			this.createControlButton(point, x);
	}

	createControlButton(origin, number) {

		var grid = window.sim.grid;
		var step = this.options.style.value=="compact"? 1 : 2;
		var point = new Point(origin.x, origin.y + grid * number * step);
		var button;

		if (this.options.style.value == "full")
			button = new Path.Circle(point, grid * 0.5);
		else if (this.options.style.value == "compact")
		{
			button = new Path.Rectangle(
				new Point(point.x - grid*0.75, point.y - grid*0.3),
				new Point(point.x + grid*0.75, point.y + grid*0.3));
		}

		button.fillColor = window.sim.appearance.color.false;
		button.data.type = "actuator";
		button.data.device = this;
		button.name = `button${number}`;
		this.children.actuators.addChild(button);

		var digit = new PointText(new Point(point.x, point.y + grid * 0.15));
		digit.fontWeight = grid * 0.4;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = `digit${number}`;
		this.children.actuators.addChild(digit);

		digit.setFillColor(window.sim.appearance.color.fill);
		digit.setStrokeColor(window.sim.appearance.color.fill);
		
	}

	act(actuator) {
		var pinName = actuator.name.replace("button", "o");
		var button = this.actuators[actuator.name];
		var digit  = this.actuators[actuator.name.replace("button", "digit")];
		var val = this.write(pinName, !this.read(pinName));
		digit.content = 0 + val; // bool -> int hack
		button.fillColor = window.sim.appearance.color[String(val)];
	}

	reset() {
		return;
	}

	recolor(color) {
		super.recolor(color);
		var qty = 1;
		if (this.options.buttons)
			qty = this.options.buttons.value;
		for (var x = 0; x < qty; x++)
		{
			this.actuators[`digit${x}`].fillColor = window.sim.appearance.color.fill;
			this.actuators[`digit${x}`].strokeColor = window.sim.appearance.color.fill;
		}
	}
}


Devices.Interfaces.Light = class Light extends Devices.Device {

	constructor(circuit, point) {

		const packageData = {
			"pins": [
				{"name":"i", "mode":"in", "side":2, "offset":0,}
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
				"symbol": [
					{
						"segmentData": [ 
							{"point":[1,0.25]},
							{"point":[1.75,1]},
							{"point":[1,1.75]},
							{"point":[0.25,1]} 
						],
						"closed": true,
						"smooth": true
					}, {
						"segmentData": [
							{"point":[0,1]},
							{"point":[0.25,1]}
						]
					}

				],
				"label": null
			}	
		}

		super(circuit, point, packageData);
		this.createLight(point);
		this.state = this.read("i");
	}

	createLight(point) {

		var light = new Path.Circle(point, window.sim.appearance.size.grid * 0.45);
		light.fillColor = window.sim.appearance.color.undefined;
		light.name = "light";
		light.data.type = "body";
		this.addChild(light);
	}

	light() {
		if (this.state === true)
			return this.children["light"].fillColor = window.sim.appearance.color.true;
		else if (this.state === false)
			return this.children["light"].fillColor = window.sim.appearance.color.false;
		return this.children["light"].fillColor = window.sim.appearance.color.undefined;
	}

	update() {
		if (this.read("i") === this.state)
			return;
		this.state = this.read("i");
		this.light();
	}
}


Devices.Interfaces.SevenSegment = class SevenSegment extends Devices.Device {

	static packageData = {
			"pins": [
				{"name":"bit0", "mode":"in", "side":2, "offset":0},
				{"name":"bit1", "mode":"in", "side":2, "offset":1},
				{"name":"bit2", "mode":"in", "side":2, "offset":2},
				{"name":"bit3", "mode":"in", "side":2, "offset":3}
			],
			"body": {
				"origin": {
					x:1,
					y:1
				},
				"dimensions": {
					"width": 4,
					"height": 5
				},
				"symbol": null,
				"label": null
			}	
		};

	static hexDict = ["0","1","2","3",
				"4","5","6","7",
				"8","9","A","B",
				"C","D","E","F"];

	constructor(circuit, point) {

		super(circuit, point);
		this.createDigit(point);
		console.log(this.digit, "!!!");
		
	}

	get digit() {
		return this.decorations["digit"];
	}

	createDigit(point) {
		var digitOffset = new Point(
			window.sim.appearance.size.grid,
			window.sim.appearance.size.grid*2.5
			);
		var digit = new PointText(point.add(digitOffset));
		digit.fontSize = window.sim.appearance.size.grid * 3;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = "digit";
		digit.data.type = "bodyPart";
		digit.fillColor = window.sim.appearance.color.highlighted;
		digit.strokeColor = window.sim.appearance.color.highlighted;
		this.children.decorations.addChild(digit);
	}

	update() {	
		var number = 0; // pins go in a sequence from lsb to msb
		var order = 1;
		for (var x = 0; x < 4; x++)
		{
			if (this.read(`bit${x}`) === true)
				number += order;
			order *= 2;
		}
		this.digit.content = Devices.Interfaces.SevenSegment.hexDict[number];
	}

	recolor(color) {
		super.recolor(color);
		this.digit.fillColor = window.sim.appearance.color.highlighted;
		this.digit.strokeColor = window.sim.appearance.color.highlighted;
	}
}
