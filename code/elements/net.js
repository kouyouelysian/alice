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

	get wires() {
		return this.children.wires.children;
	}

	get junctions() {
		return this.children.junctions.children;
	}

	get outputPin() {
		for (const pin of this.connections) {
			if (pin.mode == "out")
				return pin;
		}
		return false;
	}

	get hasNoWires() {
		if (this.children.wires.children.length > 0)
			return false;
		if (this.children.junctions.children.length > 0)
			return false;
		return true;
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

	import(netRecord) {
		this.circuit.isAnIC? this.importLogic(netRecord) : this.importGui(netRecord);	
	}

	importLogic(netRecord) {
		for (var connRecord of netRecord.connections) {
			var [nameDevice, namePin] = connRecord.split(".");
			var dev = this.circuit.devices[nameDevice];
			if (!dev)
				return window.sim.throwError(`Import halted: cannot locate device ${nameDevice}`);
			var pin = dev.pins[namePin];
			if (!pin)
				return window.sim.throwError(`import halted: cannot locate pin ${namePin} of ${nameDevice}`);
			pin.connect(this);
		}
	} 

	importGui(netRecord) {
		for (var wireRecord of netRecord.wires) {
			var w = new Wire(this.circuit);
			w.renet(this);
			w.start(new Point(wireRecord.start.x, wireRecord.start.y));
			w.finish(new Point(wireRecord.finish.x, wireRecord.finish.y));
		}
		this.name = netRecord.name;
	}

	remove() {
		this.parent.freeIndex(this.name);
		super.remove();
	}

	tick() {

		this.state = undefined;
		var ins = [];

		for (const pin of this.connections) { // first find out this net's state
	
			switch (pin.mode)
			{
				case 'hi-z':
					continue;
				case 'out':
					if (this.state == undefined)
						this.state = pin.state;
					else
					{
						debugCircle(pin.lastSegment.point);
						this.recolor(window.sim.appearance.color.highlighted);
						return window.sim.throwError(`SHORT CIRCUIT on net ${this.name} in circuit ${this.circuit.name}:\
							pin ${pin.name} of ${pin.device.name} is not the only output on net!`);
					}
					continue;
				case 'in':
					ins.push(pin)
					continue;
			}
		}

		for (var inPin of ins)
			inPin.set(this.state);
	}



	frame() {
		this.autoColor();
		for (const pin of this.connections) { // then distribute it to all input pins
			pin.autoColor();
		}
	}

	removeIfEmpty() {
		if (this.connections.length > 0)
			return;
		if (this.wires.length > 0)
			return;
		if (this.junctions.length > 0)
			return;
		this.remove();
	}

	_steal(onet, aname) {
		var src = onet.children[aname];
		var dest = this.children[aname];
		dest.children = dest.children.concat(src.children);
	}
	
	mergeWith(otherNet) {
		
		//this._steal(otherNet, "junctions");
		//this._steal(otherNet, "wires");
		this.children.junctions.addChildren(otherNet.children.junctions.removeChildren());
		this.children.wires.addChildren(otherNet.children.wires.removeChildren());

		for (var pin of otherNet.connections) {
			pin.renet(this);
		}

		otherNet.remove();
	}

	recolor(color) {
		this.color = color;
		this.strokeColor = color;
		this.fillColor = color;
	}

	autoColor() {
		if (this.state === false)
			return this.recolor(window.sim.appearance.color.false);
		else if (this.state === true)
			return this.recolor(window.sim.appearance.color.true);
		this.recolor(window.sim.appearance.color.undefined);
	}

	setState(state) {
		this.state = state;
		this.autoColor(state);
	}

	wireRemovalScan(junctions) {

		if (junctions.length!=2 || !junctions[0] || !junctions[1])
			return;

		var pointA = junctions[0].position;
		var pointB = junctions[1].position;

		var splitNet = new Net(this.circuit); //net>nets>circuit
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

	highlight() {
		this.recolor(window.sim.appearance.color.highlighted);
		for (var c of this.connections)
			c.strokeColor = window.sim.appearance.color.highlighted;
	}

	unhighlight() {
		this.recolor(window.sim.appearance.color.undefined);
		for (var c of this.connections)
			c.autoColor();
	}
}
