class Wire extends Path {

	constructor(circuit, point=undefined) {

		super();
		this.data.type = "wire";	
		this.netElement = true;
		this.circuit = circuit;
		this.strokeColor = window.sim.appearance.color.undefined;
		this.strokeWidth = window.sim.appearance.size.wire;

		this.renet(new Net(circuit));

		if (point)		
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

	get sides() {
		return [this.side1, this.side2];
	}

	get junctions() {
		var out = [];
		for (var side of this.sides) {
			var j = side.findEditable({type:"junction"});
			if (j)
				out.push(j); 
		}
		return out;
	}

	get angle() {
		const testPoint = this.firstSegment.point.subtract(this.lastSegment.point);
		return testPoint.getAngle();
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

	add(point) { // add point override
		point.quantize(window.sim.grid);
		return super.add(point);
	}
	
	remove() {

		var juncs = this.junctions; // has to be invoked and cloned
		this.lastSegment.remove();
		this.lastSegment.remove();
		this.net.wireRemovalScan(juncs)
		for (var x = 0; x < juncs.length; x++) {
			if (!juncs[x].update()) // if junc deleted self
				juncs[x] = undefined; // mark its ref as undefined
		}
		super.remove();	
	}

	kill() {
		return super.remove();
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
	}

	splitAt(point) {
		if (point.isClose(this.side1,0) || point.isClose(this.side2,0))
			return;
		var newWire = new Wire(this.circuit, point.clone());
		newWire.renet(this.net);
		newWire.add(point.clone());
		newWire.add(this.lastSegment.point.clone());
		this.lastSegment.remove();
		this.add(point.clone());
	}

	mergeWith(other) {

		if ((this.angle - other.angle) % 180 != 0)
			return false; // don't merge non-parallel wires

		var midpoint = this.side1;
		if (!(midpoint.isClose(other.side1,0) || midpoint.isClose(other.side2,0)))
			midpoint = this.side2;
		if (!(midpoint.isClose(other.side1,0) || midpoint.isClose(other.side2,0)))
			return false; // don't merge wires that have no touching points

		this.getSide(midpoint,true).point = other.getOtherSide(midpoint).clone();
		other.kill();
		return true;
	}

	break() {
		var j = new Junction(this.middle, this.net);
		this.splitAt(j.position);
		return j;
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

}
