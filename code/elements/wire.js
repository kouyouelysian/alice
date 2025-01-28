class Wire extends Path {

	constructor(point, circuit, fromGui=true) {

		super();
		this.data.type = "wire";	
		this.netElement = true;
		this.circuit = circuit;
		this.strokeColor = window.sim.appearance.color.undefined;
		this.strokeWidth = window.sim.appearance.size.wire;

		this.renet(new Net(circuit));

		if (fromGui)		
			this.start(point, circuit);
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
		newNet.children["wires"].addChild(this);
	}

	remove(bare=false) {

		if (bare) // for inner functinos like merge; omits all the merging hussle
			return super.remove();

		var juncs = [
			this.side1.findEditable({type:"junction"}),
			this.side2.findEditable({type:"junction"})
		];

		this.lastSegment.remove();
		this.lastSegment.remove();

		for (const j of juncs) {
			if (!j)
				continue;
			j.radiusUpdate();
		}

		this.net.wireRemovalScan(juncs)
		super.remove();	
	}

	start(point, circuit) {
		this.add(point);
		this.add(point);
		this.place(point);
	}

	finish(point, dragEnd=true) {
		this.lastSegment.point = point;
		this.place(point);
	}

	place(point) {
		new Junction(point, this.net);
		/*
		var junc = point.findEditable({type:"junction"});
		var wire = point.findEditable({type:"wire", exclude:this});

		if (junc) {
			if (junc.net != this.net)
				junc.net.mergeWith(this.net);
			junc.radiusUpdate();
		}
		else if (wire) {

		}
		else {
			
		}
		*/

	}
	/*
	contact(otherWire, point, parallelOnly=true) {
		// merge the nets of the two wires
		if (this.net != otherWire.net)
			otherWire.net.mergeWith(this.net);		

		var junc = point.findEditable({type:"junction", net:otherWire.net});
		junc? junc.radiusUpdate() : otherWire.splitAt(point);

	}
	*/
	/*
	mergeAt(midpoint) {

		var otherWires = midpoint.findEditable({type:"wire", exclude:this, all:true});

		if (!otherWires)
			return false;
		if (otherWires.length > 1)
		{
			midpoint.findEditable({type:"junction"}).radiusUpdate();
			return false; // don't merge if there are many wires out there
		}

		if (midpoint.findEditable({type:"pin"}))
			return false; // no merging if the junction has a pin

		var otherWire = otherWires[0]; // the first and only one is the one we merge with
		if (!this.isParallel(otherWire))
			return false; // don't merge if not parallel

		midpoint.findEditable({type:"junction"}).remove(true); // remove junction in bare mode
		this.firstSegment.point.isClose(midpoint,0)? this.firstSegment.remove() : this.lastSegment.remove();
		this.add(otherWire.getOtherSide(midpoint));
		otherWire.remove(true) // remove the now unneeded wire in bare mode
		return true;
	}
	*/

	splitAtJunction(junc) {
		var p = junc.position;
		if (p.isClose(this.side1,0) || p.isClose(this.side2,0))
			return;
		var newWire = new Wire(p, this.circuit, false);
		newWire.renet(this.net);
		newWire.add(p);
		newWire.add(this.lastSegment.point);
		this.lastSegment.remove();
		this.add(p);

	}

	break() {
		var j = new Junction(this.middle, this.net);
		this.splitAtJunction(j);
		return j;
	}

	/*
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
	*/
	/*
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
	*/

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
