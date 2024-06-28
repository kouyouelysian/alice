Devices.Interfaces = {};


Devices.Interfaces.Source = class Source extends Devices.Device {
	constructor(parentGroup, point) {

		super(parentGroup, point);
		this.write('o', false);
		this.createControlButton(point);
		
	}

	createControlButton(point) {

		var button = new Path.Circle(point, window.sim.appearance.size.grid * 0.5);
		button.fillColor = window.sim.appearance.color.false;
		console.log(window.sim.appearance.color.false);
		button.data.isActuator = true;
		button.data.type = "body";
		button.data.device = this;
		button.name = "button";
		this.addChild(button);

		var digit = new PointText(new Point(point.x, point.y + window.sim.appearance.size.grid * 0.15));
		digit.fontWeight = window.sim.appearance.size.grid * 0.4;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = "digit";
		this.addChild(digit);
		digit.fillColor = window.sim.appearance.color.fill;
		digit.strokeColor = window.sim.appearance.color.fill;
		

	}


	act(actuator) {

		var state = !this.read("o");
		this.write("o", state);
		if (state)
		{
			this.children["button"].fillColor = window.sim.appearance.color.true;
			this.children["digit"].content = "1";
		}
		else
		{
			this.children["button"].fillColor = window.sim.appearance.color.false;
			this.children["digit"].content = "0";
		}
		
	}

	reset() {
		return;
	}

	recolor(color) {
		super.recolor(color);
		this.children["digit"].fillColor = window.sim.appearance.color.fill;
		this.children["digit"].strokeColor = window.sim.appearance.color.fill;

	}
}
Devices.Interfaces.Light = class Light extends Devices.Device {

	constructor(parentGroup, point) {

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

		super(parentGroup, point, packageData);
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


Devices.Interfaces.EightSegment = class EightSegment extends Devices.Device {

	constructor(parentGroup, point) {

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

		super(parentGroup, point, packageData);
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