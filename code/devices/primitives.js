Devices.Primitives = {};

Devices.Primitives.IntegratedCircuit = class PullDown extends Devices.Device {

	constructor(circuit, point, circuitName) {

		super(circuit, point);
		this.circuit = window.sim.circuits.children[circuitName];
		if (!this.circuit || this.circuit.integrationDetails === {})
			return;
	}

	static doNotIndex = true;
};

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


Devices.Primitives.InOutPin =  class InOutPin extends Devices.Device {

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

	static dirs = ["inbound", "outbound"]

	constructor(circuit, point) {

		var names = ["inbound", "outbound"];
		var opts = {
			"direction": {"type":"choice", "choices":Devices.Primitives.InOutPin.dirs, "value":Devices.Primitives.InOutPin.dirs[0]},
			"label": {"type":"string", "value":null}
		};

		super(circuit, point, opts);
	}

	get packageData() {
		
		var pd = bmco.clone(Devices.Primitives.InOutPin.packageData);
		
		var i = {
			"segmentData": [ 
				{"point":[0,0.5]},
				{"point":[3.5,0.5]},
				{"point":[4,1]},
				{"point":[3.5,1.5]},
				{"point":[0,1.5]}
			],
			"closed": true
		};
			
		var o = {
			"segmentData": [ 
				{"point":[4,0.5]},
				{"point":[0.5,0.5]},
				{"point":[0,1]},
				{"point":[0.5,1.5]},
				{"point":[4,1.5]}
			],
			"closed": true
		};

		// outbound iopin - in-facing pin is input. and vice versa
		pd.body.symbol.push(this.options.direction.value == Devices.Primitives.InOutPin.dirs[0]? i : o);
		pd.pins[0].mode = (this.options.direction.value == Devices.Primitives.InOutPin.dirs[0]? "out" : "in");
		if (this.options.label.value === null)
			this.options.label.value = this.name.replace("InOutPin", "io");
		pd.pins[0].label = this.options.label.value;

		return pd;

	}

	reload() {
		this.recreatePackage();
	}
}
