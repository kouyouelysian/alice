Devices.Gates = {}

Devices.Gates.Not = class Not extends Devices.Device {

	constructor(circuit, point) {

		const packageData = {
			"pins": [
				{"name":"i", "mode":"in", "side":2, "offset":0,},
				{"name":"o", "mode":"out", "side":0, "offset": 0, "bulb":true}
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
							{"point":[0,0]},
							{"point":[2,1]},
							{"point":[0,2]} 
						],
						"closed": true
					}

				],
				"label": null
			}	
		}
		super(circuit, point, packageData);
	}

	update() {
		this.write("o", !this.read("i"));
	}	
}

Devices.Templates.Gate = class Gate extends Devices.Device { // general constructor for 3-pin gates. not to be used directly in circuits.
	constructor(circuit, point, symbol, invertedOutput = false) {
		const packageData = {
			"pins": [
				{"name":"a", "mode":"in", "side":2, "offset":0},
				{"name":"b", "mode":"in", "side":2, "offset":2},
				{"name":"q", "mode":"out", "side":0, "offset": 1, "bulb":invertedOutput}
			],
			"body": {
				"origin": {
					x:1,
					y:1
				},
				"dimensions": {
					"width": 3,
					"height": 4
				},
				"symbol": symbol,
				"label": null
			}	
		}
		super(circuit, point, packageData);
	}
}

Devices.Gates.And = class And extends Devices.Templates.Gate {
	constructor(circuit, point, inverted=false) {
		var symbol = [{
			"segmentData": [ 
				{"point":[0,0.5]}, 
				{"point":[1.5,0.5], "handles":{"in":[0,0],"out":[0.75,0]}}, 
				{"point":[3,2], "handles":{"in":[0,-0.75],"out":[0,0.75]}}, 
				{"point":[1.5,3.5], "handles":{"in":[0.75,0],"out":[0,0]}}, 
				{"point":[0,3.5]} 
				],
			"closed": true
		}];
		super(circuit, point, symbol, inverted);
	}
	update() {
		this.write("q", this.read("a") && this.read("b"));
	}	
}


Devices.Gates.Or = class Or extends Devices.Templates.Gate {
	constructor(circuit, point, inverted=false) {
		var symbol = [{
			"segmentData": [ 
				{"point":[-0.25,0.5]}, 
				{"point":[0.75,0.5], "handles":{"in":[0,0],"out":[0.75,0]}}, 
				{"point":[3,2], "handles":{"in":[-0.5,-0.75],"out":[-0.5,0.75]}}, 
				{"point":[0.75,3.5], "handles":{"in":[0.75,0],"out":[0,0]}}, 
				{"point":[-0.25,3.5]},
				{"point":[0.25,2], "handles":{"in":[0,1],"out":[0,-1]}} 
				],
			"closed": true
		}];
		super(circuit, point, symbol, inverted);
	}

	update() {
		this.write("q", this.read("a") || this.read("b"));
	}	
}

Devices.Gates.Xor = class Xor extends Devices.Templates.Gate {
	constructor(circuit, point, inverted=false) {
		var symbol = [{
			"segmentData": [ 
				{"point":[0.25,0.5]}, 
				{"point":[0.75,0.5], "handles":{"in":[0,0],"out":[0.75,0]}}, 
				{"point":[3,2], "handles":{"in":[-0.5,-0.75],"out":[-0.5,0.75]}}, 
				{"point":[0.75,3.5], "handles":{"in":[0.75,0],"out":[0,0]}}, 
				{"point":[0.25,3.5]},
				{"point":[0.75,2], "handles":{"in":[0,1],"out":[0,-1]}} 
				],
			"closed": true
		}, {
			"segmentData": [
				{"point":[-0.25,3.5]},
				{"point":[0.25,2], "handles":{"in":[0,1],"out":[0,-1]}},
				{"point":[-0.25,0.5]},
				{"point":[0.25,2], "handles":{"in":[0,-1],"out":[0,1]}},
				{"point":[-0.25,3.5]}
			],
			"closed": false
		}
		];
		super(circuit, point, symbol, inverted);
	}
	update() {
		this.write("q", (this.read("a") != this.read("b")));
	}	
}

Devices.Gates.Nand = class Nand extends Devices.Gates.And {
	constructor(circuit, point) {
		super(circuit, point, true);
	}
	update() {
		this.write("q", !(this.read("a") && this.read("b")));
	}	
}

Devices.Gates.Nor = class Nor extends Devices.Gates.Or {
	constructor(circuit, point) {
		super(circuit, point, true);
	}
	update() {
		this.write("q", !(this.read("a") || this.read("b")));
	}	
}

Devices.Gates.Xnor = class Xnor extends Devices.Gates.Xor {
	constructor(circuit, point) {
		super(circuit, point, true);
	}
	update() {
		this.write("q", !(this.read("a") != this.read("b")));
	}	
}

