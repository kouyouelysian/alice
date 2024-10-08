class Net extends Group {

	constructor(circuit) {
		
		super();
	
		this.name = "net"+circuit.children.nets.getIndex();
		circuit.children.nets.addChild(this);
		this.data.type = "net";

		this.color = window.sim.appearance.color.undefined;
		this.width = window.sim.appearance.size.wire;	

		this.state = undefined;

		const wires = new Group();
		wires.name = "wires";
		this.addChild(wires);

		const junctions = new Group();
		junctions.name = "junctions";
		this.addChild(junctions);

		this.connections = [];

		this.data.draggedWire = null;

	}

	get circuit() {
		return this.parent.parent;
	}

	get outputPin() {
		for (const pin of this.connections) {
			if (pin.mode == "out")
				return pin;
		}
		return false;
	}

	export() {
		var record =  {
			"name": this.name,
			"wires": [],
			"connections": []
		};

		for (var w of this.children.wires.children)
			record.wires.push(w.export());
		
		for (var c of this.connections)
			record.connections.push(`${c.device.name}.${c.name}`);

		return record;
	}

	import(netRecord, gui=true) {
		gui? this.importGui(netRecord)
			: this.importNoGui(netRecord);
	}

	importGui(netRecord) {

	}

	importNoGui(netRecord) {
		for (var nc of netRecord.connections) {
			var [dName, pName] = nc.split(".");
			var device = this.circuit.children.devices.children[dName];
			var pin = device.children.pins.children[pName];
			pin.connect(this);
		}
	}

	remove() {
		this.parent.freeIndex(this.name);
		super.remove();
	}

	update() {

		var stateUpdated = false;
		
		for (const pin of this.connections) { // first find out this net's state

			if (pin.mode == "out")
			{		
				if (stateUpdated)
				{
					debugCircle(pin.lastSegment.point);
					this.recolor(window.sim.appearance.color.highlighted);
					return window.sim.throwError(`SHORT CIRCUIT on net ${this.name} in circuit ${this.circuit.name}: pin ${pin.name} of ${pin.device.name} is not the only output on net!`);
				}
				stateUpdated = true;
				if (this.state == pin.state)
					continue;
				this.setState(pin.state);
			}
		}

		if (!stateUpdated) // no outputs located
			this.setState(undefined);

		for (const pin of this.connections) { // then distribute it to all input pins
			if (pin.mode == "in")
				pin.set(this.state, this.strokeColor);
		}
		return true;
	}

	

	mergeWith(otherNet) {
		this.children["junctions"].children = this.children["junctions"].children.concat(otherNet.children["junctions"].children); 
		this.children["wires"].children = this.children["wires"].children.concat(otherNet.children["wires"].children); 
		this.connections = this.connections.concat(otherNet.connections);
		otherNet.remove();
	}

	recolor(color) {
		this.color = color;
		this.strokeColor = color;
		this.fillColor = color;
	}

	setState(state) {
		this.state = state;
		this.colorByState(state);
	}

	wireRemovalScan(wire) {
		var pointA = wire.firstSegment.point;
		var pointB = wire.lastSegment.point;
		wire.segments = [];

		var splitNet = new Net(this.parent.parent); //net>nets>circuit
		if (this.hasRouteTo(pointA, pointB, splitNet))
			this.mergeWith(splitNet)
	}

	hasRouteTo(goal, location, newNet)
	{
		if (location.x == goal.x && location.y == goal.y)
			return true; // if goal met - return with true
 
		var junc = location.findEditable({type:"junction", net:this});
		junc.renet(newNet); // renet this junction to exclude it from further search

		var wires = location.findEditable({type:"wire", net:this, all:true});
		if (!wires) // if this is a stub junction - cut this branch
			return false;

		for (var wire of wires)
		{
			wire.renet(newNet);
		 	if (this.hasRouteTo(goal, wire.getOtherSide(location), newNet))
			  return true;
			
		}
		return false;
	}

	connectionAdd(pin) {
		if (this.connections.indexOf(pin) == -1)
			this.connections.push(pin);
	} 

	colorByState(state) {
		if (state === true)
			this.recolor(window.sim.appearance.color.true);
		else if (state === false)
			this.recolor(window.sim.appearance.color.false);
		else
			this.recolor(window.sim.appearance.color.undefined);
	}

	highlight() {
		this.recolor(window.sim.appearance.color.highlighted);
	}

	unhighlight() {
		this.recolor(window.sim.appearance.color.undefined);
	}
}
