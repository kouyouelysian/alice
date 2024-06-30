Devices.Primitives = {};

Devices.Primitives.IntegratedCircuit = class extends Devices.Device {

	constructor(parentGroup, point, circuitName) {

		super(parentGroup, point);
		this.circuit = window.sim.circuits.children[circuitName];
		if (!this.circuit || this.circuit.integrationDetails === {})
			return;
	}

	static doNotIndex = true;
};

Devices.Primitives.PullUp = class extends Devices.Device {

	constructor(parentGroup, point) {

		const packageData = {
			pins: [{"name":"leg", "mode":"hi-z", "side":3, "offset":0}],
			body: {
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
							{"point":[0.6,0]},
							{"point":[1.4,0]},
							{"point":[1.4,2]},
							{"point":[0.6,2]}
						],
						"closed": true
					},
					{
						"segmentData": [ 
							
							{"point":[1,0]},
							{"point":[1,-1]},
						]
					},
					{
						"segmentData": [ 
							
							{"point":[1,-1]},
							{"point":[1.3,-0.4]}
						]
					},
					{
						"segmentData": [ 
							
							{"point":[1,-1]},
							{"point":[0.7,-0.4]}
						]
					}

				],
				"label": null
			}
		};

		super(parentGroup, point, packageData);
	}

	update() {
		
		this.mode("leg", "hi-z");

		if (!this.getPinByName("leg").net)
			return;

		for (var p of this.getPinByName("leg").net.connections)
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

Devices.Primitives.PullDown = class extends Devices.Device {

	constructor(parentGroup, point) {

		const packageData = {
			pins: [{"name":"leg", "mode":"hi-z", "side":1, "offset":0}],
			body: {
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

		super(parentGroup, point, packageData);

	}

	update() {
		
		this.mode("leg", "hi-z");

		if (!this.getPinByName("leg").net)
			return;

		for (var p of this.getPinByName("leg").net.connections)
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