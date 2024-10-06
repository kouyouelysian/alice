Devices.Primitives = {};

Devices.Primitives.ICPin =  class ICPin extends Devices.Device {

	static packageData = {
		pins: [{"name":"io", "mode":"hi-z", "side":0, "offset":0, "label":null}],
		body: {
			"origin": {
				x:1,
				y:1
			},
			"dimensions": {
				"width": 4,
				"height": 2
			},
			"symbol": [],
			"label": null
		}
	}

	//static dirs = ["inbound", "outbound", "pass"]

	constructor(circuit, point) {

		var opts = {
			//"direction": {"type":"choice", "choices":Devices.Primitives.ICPin.dirs, "value":Devices.Primitives.ICPin.dirs[0]},
			"label": {"type":"string", "value":null}
		};

		super(circuit, point, opts);
	}

	get pin() {
		return this.pins[0];
	}

	get mode() {
		return this.pins[0].mode;
	}

	set mode(m) {
		this.pins[0].mode = m;
	}

	get net() {
		return this.pins[0].net;
	}

	get packageData() {
		
		var pd = bmco.clone(Devices.Primitives.ICPin.packageData);

		pd.body.symbol = [{
			"segmentData": [ 
				{"point":[4,1]},
				{"point":[3.5,0.5]},
				{"point":[0.5,0.5]},
				{"point":[0,1]},
				{"point":[0.5,1.5]},
				{"point":[3.5,1.5]}
			],
			"closed": true
		}];


		pd.pins[0].mode = "hi-z";

		if (this.options.label.value === null)
			this.options.label.value = this.name.replace("InOutPin", "io");
		pd.pins[0].label = this.options.label.value;
		return pd;

	}

	reload() {
		this.recreatePackage();
	}

	set(val) {
		return this.pins[0].set(val);
	}

	get() {
		return this.pins[0].get();
	}
}

Devices.Primitives.PullUp = class PullUp extends Devices.Device {

	static packageData = {
			pins: [{"name":"leg", "mode":"hi-z", "side":3, "offset":0}],
			body: {
				"origin": {
					x:1,
					y:2
				},
				"dimensions": {
					"width": 2,
					"height": 3
				},
				"symbol": [
					{
						"segmentData": [ 
							{"point":[0.6,1]},
							{"point":[1.4,1]},
							{"point":[1.4,3]},
							{"point":[0.6,3]}
						],
						"closed": true
					},
					{
						"segmentData": [ 
							
							{"point":[1,1]},
							{"point":[1,0]},
						]
					},
					{
						"segmentData": [ 
							
							{"point":[1,0]},
							{"point":[1.3,0.6]}
						]
					},
					{
						"segmentData": [ 
							
							{"point":[1,0]},
							{"point":[0.7,0.6]}
						]
					}

				],
				"label": null
			}
		};

	constructor(circuit, point) {
		super(circuit, point);
	}

	update() {
		
		this.mode("leg", "hi-z");

		if (!this.pins["leg"].net)
			return;

		for (var p of this.pins["leg"].net.connections)
		{
			if (p.mode == "out") {
				if (p.name == "leg" && p.parent != this)
					return window.sim.throwError(
						"only use one pull-up or one pull-down resistor on the same net!"
					);
				return; // there's an output on the net
			}

		}
		this.mode("leg", "out");
		this.write('leg', true);

	}

	reset() {
		super.reset();
		this.mode("leg", "hi-z")
	}

};

Devices.Primitives.PullDown = class PullDown extends Devices.Device {

	static packageData = {
			pins: [{"name":"leg", "mode":"hi-z", "side":1, "offset":0}],
			body: {
				"origin": {
					x:1,
					y:1
				},
				"dimensions": {
					"width": 2,
					"height": 3
				},
				"symbol": [
					{
						"segmentData": [ 
							
							{"point":[0.6,0]},
							{"point":[1.4,0]},
							{"point":[1.4,2]},
							{"point":[0.6,2]}
						],
						"closed": true
					},
					{
						"segmentData": [ 
							
							{"point":[1,2]},
							{"point":[1,3]},
						]
					},
					{
						"segmentData": [ 
							
							{"point":[0.5,3]},
							{"point":[1.5,3]}
						]
					}

				],
				"label": null
			}
		};

	constructor(circuit, point) {
		super(circuit, point);
	}

	update() {
		
		this.mode("leg", "hi-z");

		if (!this.pins["leg"].net)
			return;

		for (var p of this.pins["leg"].net.connections)
		{
			if (p.mode == "out") {
				if (p.name == "leg" && p.parent != this)
					return window.sim.throwError(
						"only use one pull-up or one pull-down resistor on the same net!"
					);
				return; // there's an output on the net
			}

		}
		this.mode("leg", "out");
		this.write('leg', false);

	}

	reset() {
		super.reset();
		this.mode("leg", "hi-z")
	}

};
