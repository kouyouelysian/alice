class Junction extends Path {
	
	constructor(point, net) {

		super();
	
		this.data.type = "junction";
		this.netElement = true;
		this.closed = true;
		this.fillColor = net.color; // this.layer.data.style.color.undefined;

		net.children["junctions"].addChild(this);
		this.place(point);

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
		var pins = this.position.findEditable({type:"pin", all:true})
		if (!pins)	return;
		for (var p of pins)
			p.renet(newNet);
	}

	remove() {
		for (var w of this.connectedWires)
			w.remove();
		var n = this.net;
		super.remove();
		n.removeIfEmpty();
	}

	kill() {
		return super.remove();
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

	place(point=this.position) {

		var oj = point.findEditable({type:"junction", exclude:this});
		var w = point.findEditable({type:"wire", exclude:this.net});

		if (oj && (oj.net != this.net))
		{
			oj.net.mergeWith(this.net);
			oj.update();
			return this.remove();
		}

		this.add(point); // dummy segment at center until it gets circle'd

		if (w) {
			w.splitAt(this.position);
			w.net.mergeWith(this.net);
		}

		this.update(point);
	}

	update(notCount=null, point = this.position) {

		var radius = window.sim.appearance.size.junction.normal;

		var wiresAtJunction = point.findEditable({type:"wire", all:true, exclude:notCount, net:this.net});
		var pinsAtJunction = point.findEditable({type:"pin", all:true, net:this.net});

		var count = 0;
		if (wiresAtJunction)
			count += wiresAtJunction.length;
		if (pinsAtJunction)
			count += pinsAtJunction.length;

		if (count==0)
		{
			this.kill(); // if ran out of wires at this junction - remove self
			return false;
		}

		if (count > 2)
			var radius = window.sim.appearance.size.junction.big;

		if (count == 2 && wiresAtJunction && wiresAtJunction.length==2)
		{
			if (wiresAtJunction[0].mergeWith(wiresAtJunction[1]))
				this.kill();
				return false;
		}

		function __segmentsGenerate(p,r) {
			var helperCircle = Path.Circle(p, r);
			var segments = helperCircle.segments;
			helperCircle.remove();
			return segments;
		}
		
		this.segments = __segmentsGenerate(point, radius);

		return true;
	}

}