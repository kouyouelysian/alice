Devices.Interfaces = {};

Devices.Interfaces.Source = class Source extends Devices.Device {

	static packageData = JSON.parse(JSON.stringify(Devices.defaultPackageData));

	constructor(circuit, point) {

		var opts = {
			buttons: {"type":"qty", "value":1},
			style: {"type":"choice", "choices":["full","compact"], "value":"full"}
		};	

		super(circuit, point, opts);
			
		this.createButtons(point);
	}

	get packageData() {
		
		var pd = bmco.clone(Devices.Interfaces.Source.packageData);
		
		var step = this.options.style.value=="compact"? 1 : 2;
		pd.body.dimensions.height = 2 + (this.options.buttons.value - 1) * step;
		
		for (var x = 0; x < this.options.buttons.value; x++)
			pd.pins.push(this.makePinData(x, step));
	
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

	static packageData = {
			"pins": [],
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
							{"arc":[[0.25,1],[1,0.25],[1.75,1]]},
							{"arc":[[1.75,1],[1,1.75],[0.25,1]]},
						],
						"closed": true
					}, {
						"segmentData": [
							{"point":[0,1]},
							{"point":[0.25,1]}
						]
					}

				],
				"label": null
			}	
		};

	constructor(circuit, point) {

		var opts = {
			lights: {type:"qty", value:1},
			style: {type:"choice", choices:["full","compact"], value:"full"}
		};	

		super(circuit, point, opts);
		
		this.createAllLights(point);
	}

	get packageData() {
		
		var pd = JSON.parse(JSON.stringify(Devices.Interfaces.Light.packageData));
		var step = this.options.style.value=="compact"? 1 : 2;
		var height = 2 + (this.options.lights.value - 1) * step;
		pd.body.dimensions.height = height; 
		var secondArc = pd.body.symbol[0].segmentData[1].arc;
		for (var saPoint of secondArc)
			saPoint[1] += height-2;
		for (var y = 0; y < this.options.lights.value; y++)
		{
			pd.pins.push(this.makePinData(y, step));
			var tsd = JSON.parse(JSON.stringify(pd.body.symbol[1]));
			for (var p of tsd.segmentData)
				p.point[1] += y*step;
			pd.body.symbol.push(tsd);
		}
		
		return pd;
	}
	
	get lights() {
		return this.children.decorations.children;
	}

	makePinData(n,step=2) {
		return {"name":`i${n}`, "mode":"in", "side":2, "offset":n*step,}
	}

	createAllLights(point=this.originAbsolute, step = 2) {
		var qty = 1;
		if (this.options)
			qty = this.options.lights.value;

		for (var x = 0; x < qty; x++)
		{
			var a = this.originAbsolute.clone();
			a.y += window.sim.grid * x * step;
			this.createLight(a);
		}
	}

	createLight(point) {
		var light = new Path.Circle(point, window.sim.appearance.size.grid * 0.45);
		light.fillColor = window.sim.appearance.color.undefined;
		light.strokeColor = window.sim.appearance.color.devices;
		light.name = "light";
		light.data.type = "bodyPart";
		this.children.decorations.addChild(light);
	}

	light(n, state) {
		if (state === true)
			return this.lights[n].fillColor = window.sim.appearance.color.true;
		else if (state === false)
			return this.lights[n].fillColor = window.sim.appearance.color.false;
		return this.lights[n].fillColor = window.sim.appearance.color.undefined;
	}

	update() {
		for (var x = 0; x < this.pins.length; x++)
			this.light(x, this.read(`i${x}`));	
	}

	reload() {
		var step = this.options.style.value=="compact"? 1 : 2;
		var o = this.orientation.valueOf();
		this.reorientTo(0)
		this.recreatePackage();
		this.createAllLights(this.originAbsolute, step);
		this.reorientTo(o);
	}

}


Devices.Interfaces.HexDigit = class HexDigit extends Devices.Device {

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
		digit.content = '?';
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
			if (this.read(`bit${x}`) === undefined)
				return this.digit.content = "?";

			if (this.read(`bit${x}`) === true)
				number += order;
			order *= 2;
		}
		this.digit.content = Devices.Interfaces.HexDigit.hexDict[number];
	}

	recolor(color) {
		super.recolor(color);
		this.digit.fillColor = window.sim.appearance.color.highlighted;
		this.digit.strokeColor = window.sim.appearance.color.highlighted;
	}
}
