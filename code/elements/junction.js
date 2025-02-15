class Junction extends Path {
	
	constructor(point, net) {

		super();
		console.log(net.children["junctions"]);
		net.children["junctions"].addChild(this);
		console.log(net.children["junctions"]);
		//this.net = net;
		console.log("created new junction at", point, "at net", net.name);

		this.data.type = "junction";
		this.netElement = true;
		this.closed = true;
		this.fillColor = net.color; // this.layer.data.style.color.undefined;
		this.add(point); // dummy segment at center until it gets circle'd
		this.radiusUpdate(point);

	}

	get net() {
		return this.parent.parent;
	}

	get circuit() {
		return this.net.circuit;
	}

	get connectedWires() {
		var wires = this.position.findEditable({type:"wire", net:this.net, all:true});
		return wires? wires : [];
	}

	renet(newNet) {
		newNet.children["junctions"].addChild(this);
	}

	remove(bare=false) {
		if (bare)
			return super.remove();
		for (var w of this.connectedWires)
			w.remove();
	}

	pick() {
		
		return;
	}

	reposition(point) {

		for (var w of this.connectedWires)
		{
			var s = w.getSide(this.position, true);
			s.point = point;
		}
		this.position = point;
		
	}

	place() {
		/*
		var otherWires = this.position.findEditable({type:"wire", exclude:this.connectedWires, all:true});
		if (!otherWires || otherWires.length==0)
		{
			this.connectedWires[0].pinConnect(this.position);
			this.radiusUpdate(); // if not contacting other wires - just leave things be
			return;
		}
		// else basically emulate each wire being finished naturally
		var wires = this.connectedWires;
		var loc = new Point(this.position.x, this.position.y);
		this.remove(true); // has to happen before wires get "finished"
		for (var w of wires)
			w.finish(loc, false); // false is to not update the wire end position
		*/
	}

	radiusUpdate(notCount=null, point = this.position) {

		var radius = window.sim.appearance.size.junction.normal;

		var wiresAtJunction = point.findEditable({type:"wire", all:true, exclude:notCount, net:this.net});
		var pinsAtJunction = point.findEditable({type:"pin", all:true, net:this.net});

		var count = 0;
		if (wiresAtJunction)
			count += wiresAtJunction.length;
		if (pinsAtJunction)
			count += pinsAtJunction.length;
		//if (point.findEditable({type:"pin", all:true}))
		//	count += 1;
		console.log("count =", count);
		if (count==0)
			this.remove(true); // if ran out of wires at this junction - remove self

		if (count > 2)
			var radius = window.sim.appearance.size.junction.big;

		function __segmentsGenerate(p,r) {
			var helperCircle = Path.Circle(p, r);
			var segments = helperCircle.segments;
			helperCircle.remove();
			return segments;
		}
		
		this.segments = __segmentsGenerate(point, radius);
	}

}