class Wire extends Path {

	constructor(point, circuit, fromGui=true) {

		super();
		this.data.type = "wire";	
		this.netElement = true;
		this.circuit = circuit;
		this.strokeColor = circuit.appearance.color.undefined;
		this.strokeWidth = circuit.appearance.size.wire;

		if (fromGui)
		{
			var net = new Net(circuit);
			this.renet(net);
			this.start(point, circuit);
		}
	}

	getNet() {
		return this.parent.parent;
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
		// if this was the last wire - remove the entire net
		if (this.getNet().children["wires"].children.length == 1)
			this.getNet().remove();
		// update the device pins
		
		for (const point of [this.firstSegment.point, this.lastSegment.point])
		{
			this.pinConnectionCheck(point);
			var junc = point.findEditable({type:"junction", net:this.getNet()});
			if (junc) // junc can be null if the wire is being drawn and got cancelled
				junc.radiusUpdate(this);
		}
		// absolutely distaesteful bunch of vars because i actually have to use them after i nuke the segments
		var start  = this.firstSegment.point;
		var finish = this.lastSegment.point;
		var wiresAtStart = start.findEditable({type:"wire", net:this.getNet(), exclude:this, all:true});
		var wiresAtFinish = finish.findEditable({type:"wire", net:this.getNet(), exclude:this, all:true});
		// fi both sides had other wires, this checks if the net is still contiguous. splits off a new one if not
		if (wiresAtStart && wiresAtFinish)
			this.getNet().wireRemovalScan(this); 
		// will attempt merging other wires at this wire's start/finish if there were two and they were parallel
		this.segments = []; // this is done so that the other wires don't attempt merging with this one
		if (wiresAtStart) 
			wiresAtStart[0].mergeAt(start); 
		if (wiresAtFinish) 
			wiresAtFinish[0].mergeAt(finish);
		return super.remove();	
	}

	start(point, circuit) {
		this.add(point); // called if wire was created from the GUI -
		this.add(point); // slam in two points, the latter dragged around on mouse drag
		this.place(point); // and place the first junction automatically
	}

	finish(point) {
		this.lastSegment.point = point; // place the last point firmly on the grid
		this.place(point);
		// attempt merging at both sides
		this.mergeAt(point); 
		this.mergeAt(this.getOtherSide(point)); 
		
	}

	place(point) {
		var otherWire = point.findEditable({type:"wire", exclude:this}); 
		// if at nowhere - make junction. otherwise contact other wire, junctions handled further
		otherWire? this.contact(otherWire, point) : new Junction(point, this.getNet());
		this.pinConnect(point); // will connect a pin at that point if there's any
	}

	contact(otherWire, point, parallelOnly=true) {
		// merge the nets of the two wires
		if (this.getNet() != otherWire.getNet())
			otherWire.getNet().mergeWith(this.getNet());		

		var junc = point.findEditable({type:"junction", net:otherWire.getNet()});
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
		return otherWire.remove(true) // remove the now unneeded wire in bare mode
	}

	splitAt(splitpoint) {
		// make new wire from midpoint to finish
		var newWire = new Wire(splitpoint, this.circuit, false);
		newWire.renet(this.getNet());
		newWire.add(splitpoint);
		newWire.add(this.lastSegment.point);
		// make this wire from start to midpoint
		this.lastSegment.remove();
		this.add(splitpoint);
		// create a junction because we just split
		new Junction(splitpoint, this.getNet())
	}

	pinConnect(point) {
		var pin = point.findEditable({type:"pin"});
		if (!pin)
			return;
		pin.connect(this.getNet());
	}

	pinConnectionCheck(point) {
		var pin = point.findEditable({type:"pin"});
		if (!pin) // can't disconnect a pin that does not exist
			return;
		var wires = point.findEditable({type:"wire", net:this.getNet()});
		if (wires) // no need to disconnect a pin if it has wires from the same net
			return; 
		pin.disconnect();
	}

	getOtherSide(point) {
		var side = this.firstSegment.point;
		if (point.isClose(side, 0))
			return this.lastSegment.point;
		return side;
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
