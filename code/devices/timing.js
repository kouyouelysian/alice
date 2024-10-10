Devices.Timing = {}

Devices.Timing.Clock = class Clock extends Devices.Device {
	
	static packageData = {
		pins: [
			{name:"output", mode:"out", side:0, offset:0, initial:false}
		],
		body: {
			origin: {
				x:2,
				y:1
			},
			dimensions: {
				width: 4,
				height: 2
			},
			symbol: [
				{
					segmentData: [
						{point: [0,0]},
						{point: [4,0]},
						{point: [4,2]},
						{point: [0,2]}
					],
					closed: true
				},
				{
					segmentData: [
						{point: [0.5, 1.55]},
						{point: [0.5, 0.5]},
						{point: [1, 0.5]},
						{point: [1, 1.5]},
						{point: [1.5, 1.5]},
						{point: [1.5, 0.5]},
						{point: [2, 0.5]},
						{point: [2, 1.5]},
						{point: [2.5, 1.5]},
					]
				}
			],
			"label": null
		}
	}

	constructor(circuit, point) {
		super(circuit, point);

		this.createIndicator();

		this.counter = 0;
		
		this.options = {
			period: {"type":"qty", "value":100},
		}

	}

	createPackage(point=this.originAbsolute, circuit=this.circuit) {
		super.createPackage(point, circuit);
		this.createIndicator();
	}

	createIndicator() {
		var ind = new Path.Circle(
			this.originAbsolute.add(new Point(window.sim.grid,0)), 
			window.sim.grid * 0.35);
		ind.name = "indicator";
		ind.fillColor = window.sim.appearance.color.false;
		ind.strokeColor = window.sim.appearance.color.devices;
		this.children.decorations.addChild(ind);

	}

	update() {
		this.counter += 1;
		if (this.counter >= this.options.period.value)
		{
			this.counter = 0;
			var a = this.toggle("output");
			if (a)
				this.decorations["indicator"].fillColor = window.sim.appearance.color.true;
			else
				this.decorations["indicator"].fillColor = window.sim.appearance.color.false;
		}
	}

	reset() {
		this.write("output", false);
		this.counter = 0;
		this.decorations["indicator"].fillColor = window.sim.appearance.color.false;
	}

}