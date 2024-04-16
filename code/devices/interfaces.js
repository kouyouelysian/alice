Devices.Source = class Source extends Devices.Device {
	constructor(parentGroup, point) {

		super(parentGroup, point);
		this.name = "Manual source";
		this.write('o', false);

		this.createControlButton(point);
		
	}

	createControlButton(point) {
		var control = new Group();
		control.name = "control";

		var button = new Path.Circle(point, this.getCircuit().appearance.size.grid * 0.5);
		button.fillColor = this.getCircuit().appearance.color.false;
		button.data.type = "actuator";
		button.data.device = this;
		button.name = "button";
		control.addChild(button);

		var digit = new PointText(new Point(point.x, point.y + this.getCircuit().appearance.size.grid * 0.15));
		digit.fontWeight = this.getCircuit().appearance.size.grid * 0.4;
		digit.justification = 'center';
		digit.content = '0';
		digit.leading = 0;
		digit.name = "digit";
		digit.fillColor = button.strokeColor = this.getCircuit().appearance.color.fill;
		control.addChild(digit);

		this.addChild(control);
	}


	act(actuator) {

		var state = !this.read("o");
		this.write("o", state);
		if (state)
		{
			this.children["control"].children["button"].fillColor = this.getCircuit().appearance.color.true;
			this.children["control"].children["digit"].content = "1";
		}
		else
		{
			this.children["control"].children["button"].fillColor = this.getCircuit().appearance.color.false;
			this.children["control"].children["digit"].content = "0";
		}
		
	}
}


Devices.Light = class Light extends Devices.Device {

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
		this.name = "Light indicator";
		this.createLight(point);
		this.state = this.read("i");
	}

	createLight(point) {

		var light = new Path.Circle(point, this.getCircuit().appearance.size.grid * 0.45);
		light.fillColor = this.getCircuit().appearance.color.undefined;
		light.name = "light";
		this.addChild(light);
	}

	light() {
		if (this.state === true)
			return this.children["light"].fillColor = this.getCircuit().appearance.color.true;
		else if (this.state === false)
			return this.children["light"].fillColor = this.getCircuit().appearance.color.false;
		return this.children["light"].fillColor = this.getCircuit().appearance.color.undefined;
	}

	update() {
		if (this.read("i") === this.state)
			return;
		this.state = this.read("i");
		this.light();
	}
}