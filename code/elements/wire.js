class Wire extends Path {

	constructor(point, circuit, fromGui=true) {

		super();
		this.data.type = "wire";	
		this.netElement = true;
		this.circuit = circuit;
		this.strokeColor = window.sim.appearance.color.undefined;
		this.strokeWidth = window.sim.appearance.size.wire;

		if (fromGui)
		{
			var net = new Net(circuit);
			this.renet(net);
			this.start(point, circuit);
		}

	}

	get net() {
		return this.parent.parent;
	}

	get side1() {
		return new Point(
			this.firstSegment.point.x,
			this.firstSegment.point.y
		);
	}

	get middle() {
		var point = new Point(
			this.lastSegment.point.x - this.firstSegment.point.x,
			this.lastSegment.point.y - this.firstSegment.point.y
		);
		return this.firstSegment.point.add(point.multiply(0.5));
	}

	get side2() {
		return new Point(
			this.lastSegment.point.x,
			this.lastSegment.point.y
		);
	}

	export() {
		return {
			"start": {
				"x": this.firstSegment.point.x,
				"y": this.firstSegment.point.y
			},
			"finish": {
				"x": this.lastSegment.point.x,
				"y": this.lastSegment.point.y
			}
		};
	}	

	renet(newNet) {
		newNet.children.wires.addChild(this);
	}

	remove(bare=false) {
		if (bare) // for inner functinos like merge; omits all the merging hussle
			return super.remove();
		// if this was the last wire and no pins remain - remove the entire net
		if (this.net.children["wires"].children.length == 1 && this.net.connections.length == 0)
			this.net.remove();
		// update the device pins
		
		for (const point of [this.firstSegment.point, this.lastSegment.point])
		{
			this.pinConnectionCheck(point);
			var junc = point.findEditable({type:"junction", net:this.net});
			if (junc) // junc can be null if the wire is being drawn and got cancelled
				junc.radiusUpdate(this);
		}
		// absolutely distaesteful bunch of vars because i actually have to use them after i nuke the segments
		var start  = this.firstSegment.point;
		var finish = this.lastSegment.point;
		var wiresAtStart = start.findEditable({type:"wire", net:this.net, exclude:this, all:true});
		var wiresAtFinish = finish.findEditable({type:"wire", net:this.net, exclude:this, all:true});
		// fi both sides had other wires, this checks if the net is still contiguous. splits off a new one if not
		if (wiresAtStart && wiresAtFinish)
			this.net.wireRemovalScan(this); 
		// will attempt merging other wires at this wire's start/finish if there were two and they were parallel
		this.segments = []; // this is done so that the other wires don't attempt merging with this one
		if (wiresAtStart) 
			wiresAtStart[0].mergeAt(start); 
		if (wiresAtFinish) 
			wiresAtFinish[0].mergeAt(finish);
		super.remove();	
	}

	start(point, circuit) {
		this.add(point); // called if wire was created from the GUI -
		this.add(point); // slam in two points, the latter dragged around on mouse drag
		this.place(point); // and place the first junction automatically
	}

	finish(point, dragEnd=true) {
		if (dragEnd)
			this.lastSegment.point = point; // place the last point firmly on the grid
		this.place(point);
		// attempt merging at both sides
		this.mergeAt(point); 
		this.mergeAt(this.getOtherSide(point)); 
		
	}

	place(point) {
		var otherWires = point.findEditable({type:"wire", exclude:this, all:true}); 
		// if at nowhere - make junction. otherwise contact other wire, junctions handled further
		if (otherWires)
		{
			for (var w of otherWires)
				this.contact(w, point);
		}
		else
		{	
			new Junction(point, this.net);
			this.pinConnect(point); // will connect a pin at that point if there's any
		}
	}

	contact(otherWire, point, parallelOnly=true) {
		// merge the nets of the two wires
		if (this.net != otherWire.net)
			otherWire.net.mergeWith(this.net);		

		var junc = point.findEditable({type:"junction", net:otherWire.net});
		junc? junc.radiusUpdate() : otherWire.splitAt(point);

	}

	mergeAt(midpoint) {

		var otherWires = midpoint.findEditable({type:"wire", exclude:this, all:true});

		if (!otherWires)
			return false;
		if (otherWires.length > 1)
		{
			midpoint.findEditable({type:"junction"}).radiusUpdate();
			return false; // don't merge if there are many wires out there
		}
		var otherWire = otherWires[0]; // the first and only one is the one we merge with
		if (!this.isParallel(otherWire))
			return false; // don't merge if not parallel

		midpoint.findEditable({type:"junction"}).remove(true); // remove junction in bare mode
		this.firstSegment.point.isClose(midpoint,0)? this.firstSegment.remove() : this.lastSegment.remove();
		this.add(otherWire.getOtherSide(midpoint));
		otherWire.remove(true) // remove the now unneeded wire in bare mode
		return true;
	}

	splitAt(splitpoint) {
		// fuck off if the split point is one of th wire's ends
		if (splitpoint.isClose(this.side1,0) || splitpoint.isClose(this.side2,0))
			return;
		// make new wire from midpoint to finish
		var newWire = new Wire(splitpoint, this.circuit, false);
		newWire.renet(this.net);
		newWire.add(splitpoint);
		newWire.add(this.lastSegment.point);
		// make this wire from start to midpoint
		this.lastSegment.remove();
		this.add(splitpoint);
		// create a junction because we just split
		return new Junction(splitpoint, this.net)
	}

	pinConnect(point) {
		var pin = point.findEditable({type:"pin"});
		if (!pin)
			return;
		if (pin.net == this.net)
			return;
		return this.net.mergeWith(pin.net);
	}

	pinConnectionCheck(point) {
		var pin = point.findEditable({type:"pin"});
		if (!pin) // can't disconnect a pin that does not exist
			return;
		var wires = point.findEditable({type:"wire", net:this.net});
		if (wires) // no need to disconnect a pin if it has wires from the same net
			return; 
		pin.disconnect();
	}

	getSide(point, asSegment=false) {
		if (point.isClose(this.firstSegment.point, 0))
			return asSegment? this.firstSegment : this.firstSegment.point;
		return asSegment? this.lastSegment : this.lastSegment.point;
	}

	getOtherSide(point, asSegment=false) {
		if (point.isClose(this.firstSegment.point, 0))
			return asSegment? this.lastSegment : this.lastSegment.point;
		return asSegment? this.firstSegment : this.firstSegment.point;
	}

	getAngle() {
		const testPoint = this.firstSegment.point.subtract(this.lastSegment.point);
		return testPoint.getAngle();
	}

	isParallel(otherWire) {
		const angle1 = this.getAngle();
		const angle2 = otherWire.getAngle();
		return ((angle1 - angle2) % 180) == 0;
	}

}
