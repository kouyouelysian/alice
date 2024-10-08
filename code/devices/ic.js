Devices.IntegratedCircuit = {}


Devices.IntegratedCircuit.IC = class IntegratedCircuit extends Devices.Device {

	static packageData = {
		
		pins: [],
		body: {
			origin: {
				x: 0,
				y: 0
			},
			dimensions: {
				width: 0,
				height: 0,
			},
			symbol: [],
			label: null
		}
	}

	constructor(circuit, point, circuitName) {

		super(circuit, point);

		this.runningCircuit = undefined;
		this.sourceCircuitReference = undefined;
		if (circuitName)
		{
			if (circuitName == circuit.name)
				return window.sim.throwError("cannot put an IC of a circuit inside the circuit itself! Spare your CPU from such recursion!");
			this.sourceCircuitReference = window.sim.circuits.children[circuitName];
			if (!this.sourceCircuitReference.integrationDetails)
				return window.sim.throwError("attempting to place an IC of a circuit that has not yet been integrated!");
			this.recreatePackage();
			this.build();
		}
	}

	get packageData() {
		if (this.sourceCircuitReference)
			return this.sourceCircuitReference.integrationDetails;
		return Devices.IntegratedCircuit.IC.packageData;
	}

	load(circuit) {
		this.sourceCircuitReference = circuit;
		this.recreatePackage();
	}

	build() {
		this.runningCircuit = new Circuit(`${this.name}-${this.sourceCircuitReference.name}`, -1);
		this.runningCircuit.visible = false;
		for (var d of this.sourceCircuitReference.devices)
		{
			var dclass = eval(`Devices.${d.fullClass}`);
			var dev = new dclass(this.runningCircuit);
			dev.import(d.export());
		}

		for (var n of this.sourceCircuitReference.nets)
		{
			var net = new Net(this.runningCircuit);
			net.import(n.export(), false);
		}
	}

	reset() {
		for (var p of this.pins)
		{
			p.mode = 'hi-z';
			p.set(undefined);
		}
		this.runningCircuit.reset();
		this.build();
	}

	update() {

		for (var icPinDevice of this.runningCircuit.getDevicesByClass("Primitives.ICPin"))
		{
			var insidePin = icPinDevice.pin;
			var outsidePin = this.children.pins.children[icPinDevice.options.label.value];
			
			var rx = (outsidePin.net && outsidePin.net.outputPin && outsidePin.net.outputPin != outsidePin);
			var tx = (insidePin.net && insidePin.net.outputPin && insidePin.net.outputPin != insidePin);

			if (tx && rx)
				return window.sim.throwError("IC attempts to output a signal while something attempts to input a signal to the IC => short circuit!");
			else if (tx)
			{	// something going out
				outsidePin.mode = "out";
				insidePin.mode  = "in";
				outsidePin.set(insidePin.get());
			}
			else if (rx)
			{	// something going in
				outsidePin.mode = "in";
				insidePin.mode  = "out";
				insidePin.set(outsidePin.get());
			}
			else
			{	// nothing going nowhere
				outsidePin.mode = "hi-z";
				insidePin.mode  = "hi-z";
			}

		}

		this.runningCircuit.frame();
		
	}
};



Devices.IntegratedCircuit.ICNode = class ICNode {

}

Devices.IntegratedCircuit.ICRatnest = class ICRatnest {

}