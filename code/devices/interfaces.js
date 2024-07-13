Devices.Interfaces = {};


Devices.Interfaces.Source = class Source extends Devices.Device {
	constructor(circuit, point) {

		var packageData = Devices.defaultPackageData;
		packageData.pins = [];

		super(circuit, point, packageData);

		this.options = {
			buttons: {"type":"qty", "value":1},
			style: {"type":"choice", "choices":["full","compact"], "value":"full"}
		};
	
		this.createButtons(point);
		
	}

	reload() {
		for (var cname in this.children)
		{
			if (!isNaN(cname))
				continue;
			var c = this.children[cname];
			if (c.name.indexOf("button") != -1 || c.name.indexOf("digit") != -1)
				c.remove();
		}
		this.children.pins.removeChildren();

		this.createButtons(this.position);
		var grid = window.sim.appearance.size.grid;
		var seg1 = this.children.body.firstChild.segments[0];
		var seg2 = this.children.body.firstChild.segments[3];
		var step = this.options.style.value=="compact"? 1 : 2;
		var y = this.position.y + grid*((step*this.options.buttons.value)+(step*-1+1));
		seg1.point.y = y;
		seg2.point.y = y;
	}

	createButtons(point) {
		for (var x = 0; x < this.options.buttons.value; x++)
			this.createControlButton(point, x);
	}

	createControlButton(origin, number) {

		var grid = window.sim.appearance.size.grid;
		var step = this.options.style.value=="compact"? 1 : 2;
		var point = new Point(origin.x, origin.y + grid * number * step);
		var button;

		if (this.options.style.value == "full")
			button = new Path.Circle(point, window.sim.appearance.size.grid * 0.5);
		else if (this.options.style.value == "compact")
		{
			button = new Path.Rectangle(
				new Point(point.x - grid*0.75, point.y - grid*0.3),
				new Point(point.x + grid*0.75, point.y + grid*0.3));
		}

		button.fillColor = window.sim.appearance.color.false;
		button.data.isActuator = true;
		button.data.type = "body";
		button.data.device = this;
		button.name = `button${number}`;
		this.addChild(button);

		var digit = new PointText(new Point(point.x, point.y + grid * 0.15));
		digit.fontWeight = window.sim.appearance.size.grid * 0.4;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = `digit${number}`;
		this.addChild(digit);

		var pinData = {"name":`o${number}`, "mode":"out", "side":0, "offset":number*step};
		var bodyDimensions = {"width":1,"height":-1+step*number};
		var pin = this.children.pins.addChild(
			new Pin(this.getCircuit(), pinData, bodyDimensions, new Point(origin.x, origin.y-grid))
			);
		this.write(`o${number}`, false);

		digit.setFillColor(window.sim.appearance.color.fill);
		digit.setStrokeColor(window.sim.appearance.color.fill);
		
	}

	act(actuator) {

		var bname = actuator.name;
		var dname = bname.replace("button", "digit");
		var pname = bname.replace("button", "o");

		var state = !this.read(pname);
		this.write(pname, state);

		if (state)
		{
			this.children[bname].fillColor = window.sim.appearance.color.true;
			this.children[dname].content = "1";
		}
		else
		{
			this.children[bname].fillColor = window.sim.appearance.color.false;
			this.children[dname].content = "0";
		}
		
	}

	reset() {
		return;
	}

	recolor(color, number=0) {
		super.recolor(color);
		this.children[`digit${number}`].fillColor = window.sim.appearance.color.fill;
		this.children[`digit${number}`].strokeColor = window.sim.appearance.color.fill;

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
		light.fillColor = this.getCircuit().appearance.color.undefined;
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


Devices.Interfaces.SevenSegment = class EightSegment extends Devices.Device {

	constructor(circuit, point) {

		const packageData = {
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
		}

		super(circuit, point, packageData);
		this.createDigit(point, packageData);
		this.dict = ["0","1","2","3",
				"4","5","6","7",
				"8","9","A","B",
				"C","D","E","F"]
	}

	createDigit(point, packageData) {
		var digitOffset = new Point(
			this.getCircuit().appearance.size.grid,
			this.getCircuit().appearance.size.grid*2.5
			);
		var digit = new PointText(point.add(digitOffset));
		digit.fontSize = this.getCircuit().appearance.size.grid * 3;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = "digit";
		this.addChild(digit);
		digit.fillColor = this.getCircuit().appearance.color.highlighted;
		digit.strokeColor = this.getCircuit().appearance.color.highlighted;
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
		this.children.digit.content = this.dict[number];
	}

	recolor(color) {
		super.recolor(color);
		this.children["digit"].fillColor = window.sim.appearance.color.highlighted;
		this.children["digit"].strokeColor = window.sim.appearance.color.highlighted;
	}
}
