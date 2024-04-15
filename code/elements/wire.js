class Wire extends Path {

	constructor(point, net, fromGui=true) {

		super();
		net.children["wires"].addChild(this);

		this.net = net;
		this.data.type = "wire";	
		this.strokeWidth = 3;
		this.strokeColor = 'black';	
		this.strokeColor = net.color;
		this.strokeWidth = net.width;

		this.add(point);
		if (fromGui)
			this.add(point);		
		

		const junctionAtStart = point.findEditable({type:"junction", exclude:this});
		if (junctionAtStart)
			junctionAtStart.radiusUpdate();
		else if (fromGui) // no need for new junctions and splitting if it's from internal stuff
		{
			this.splitOtherAtSide("start");
			new Junction(point, net);
		}

		this.checkPin("start");
	}

	remove(bare=false) {

		if (bare) // for inner functinos like merge
			return super.remove();

		// get junctions
		var juncStart = this.getJunction("start");
		var juncFinish = this.getJunction("finish");

		// if this was the last wire - remove ne
		if (this.net.children["wires"].children.length == 1)
			this.net.remove();

		this.segments = []
		if (juncStart.getWiresAt({exclude:this}) && juncFinish.getWiresAt({exclude:this})) 
		{
			var splitOffNet = new Net(this.net.parent);
			if (this.hasRouteTo(juncFinish.position, juncStart.position, splitOffNet))
				this.net.mergeWith(splitOffNet);
		}
		

		// if there are some wires at both start and end junction except this one wire
		/*
		if (juncStart.getWiresAt(this) && juncFinish.getWiresAt(this))
		{
			var newNet = new Net(this.net.parent);
			if (this.net.contiguousFrom(juncStart, juncFinish.position, newNet))
				this.net.mergeWith(newNet);
		}
		*/
		// delete junctions

		if (juncStart)
			juncStart.removeWithWire(this);
		if (juncFinish) // no finish junction if the wire is being drawn
			juncFinish.removeWithWire(this);
		
		super.remove();		
	}

	renet(net) {
		net.children["wires"].addChild(this);
	}

	finish(point) {
		this.add(point);
		if (this.lastSegment.point.findEditable({type:"wire", exclude:this})) // if finish on wire
		{
			var junctionAtFinish = this.lastSegment.point.findEditable({type:"junction"});
			if (junctionAtFinish) // if on junction
			{
				junctionAtFinish.radiusUpdate();
				this.mergeAtSide("finish"); // if the other wire is alone and parallel - will merge
			}
			else // if in the middle of a wire
			{
				this.splitOtherAtSide("finish");
				new Junction(this.lastSegment.point, this.parent.parent);
			}
			//this.mergeParallelAtSide("start"); // if the result is parallel with something on		
		}
		else
			new Junction(this.lastSegment.point, this.parent.parent);	

		this.checkPin("finish");	
	}

	checkPin(side)
	{
		var pin = this.getSide(side).findEditable({type:"pin"});
		if (!pin)
			return;
		pin.connect(this.net);
		this.net.addConnection(pin);
	}

	hasRouteTo(target, point, newNet)
	{
		if (point.x == target.x && point.y == target.y)
			return true;
 
		var junc = point.findEditable({type:"junction"});
		var wires = junc.getWiresAt({exclude:this});
		junc.renet(newNet);		
		if (!wires)
			return false;
		for (var wire of wires)
		{
		 	if (wire.hasRouteTo(target, wire.getOtherSide(point), newNet))
			  return true;
			wire.renet(newNet);
		}
		return false;
	}

	getSide(side) {
		if (side == "start")
			return this.firstSegment.point;
		else if (side == "finish")
			return this.lastSegment.point;
		return null;
	}

	getOtherSide(point) {
		var end = this.getSide("start");
		if (point.isClose(end, 0))
			return this.getSide("finish");
		return end;
	}

	getJunction(side) {
		return this.getSide(side).findEditable({type:"junction", net:this.parent.parent});
	}

	getAngle() {
		const testPoint = this.getSide("start").subtract(this.getSide("finish"));
		return testPoint.getAngle();
	}

	isParallel(otherWire) {
		const angle1 = this.getAngle();
		const angle2 = otherWire.getAngle();
		return ((angle1 - angle2) % 180) == 0;
	}

	mergeWith(otherWire, parallelOnly=true) {

		if (this == otherWire)
			return false;

		if (parallelOnly && !this.isParallel(otherWire))
			return false;
		
		var midpoint = this.getSide("start");
		if (midpoint.isClose(otherWire.getSide("start"), 0) || midpoint.isClose(otherWire.getSide("finish"), 0))
			this.firstSegment.remove() // midpoint WAS the first segment (start)
		else
		{
			midpoint = this.getSide("finish");
			this.lastSegment.remove(); // midpoint turned out to be last segment (finish)
		}

		this.add(otherWire.getOtherSide(midpoint)); 
		otherWire.remove(true);

		const junction = midpoint.findEditable({type:"junction"});
		if (junction)
			junction.remove();	
		return true;
	}

	mergeAtSide(side) {
		var junction = this.getJunction(side);
		var otherWires = junction.getWiresAt({exclude:this}); // excluding this one
		if (!otherWires)
			return;
		if (otherWires.length > 1)
			return; // if there's a big junction out there - don't merge
		this.mergeWith(otherWires[0]); // parallel is enforced - only one will be merged	
	}

	splitAt(splitPoint) {
		const newWire = new Wire(splitPoint, this.parent.parent, false);
		newWire.add(splitPoint);
		newWire.add(this.getSide("finish"));
		this.lastSegment.remove();
		this.add(splitPoint);
		this.parent.insertChild(this.index, newWire);
	}

	splitOtherAtSide(side) {
		const point = this.getSide(side);
		const existingWires = point.findEditable({type:"wire", all:true, exclude:this});
		if (!existingWires)
			return;
		if (point.findEditable({type:"junction"}))
			return;
		existingWires[0].splitAt(point);
	}
}
