class Junction extends Path {
	
	constructor(point, net) {
		
		super();
		net.children["junctions"].addChild(this);
		
		//this.net = net;
		this.data.type = "junction";
		this.netElement = true;
		this.closed = true;
		this.fillColor = net.color; // this.layer.data.style.color.undefined;
		this.add(point); // dummy segment at center until it gets circle'd
		this.radiusUpdate(point);
	}

	getNet() {
		return this.parent.parent;
	}

	renet(newNet) {
		newNet.children["junctions"].addChild(this);
	}

	remove() {
		var wires = this.position.findEditable({type:"wire", net:this.net, all:true});
		console.log(wires);
		for (var w of wires)
			w.remove();
		return super.remove();
	}

	radiusUpdate(notCount=null, point = this.position) {

		var radius = this.getNet().getCircuit().appearance.size.junction.normal;

		var wiresAtJunction = point.findEditable({type:"wire", all:true, exclude:notCount});
		if (!wiresAtJunction)
			this.remove(); // if ran out of wires at this junction - remove self

		var count = 0;
		if (wiresAtJunction)
			count = wiresAtJunction.length;
		if (point.findEditable({type:"pin", all:true}))
			count += 1;

		if (count >= 3)
			var radius = this.getNet().getCircuit().appearance.size.junction.big;

		function __segmentsGenerate(p,r) {
			var helperCircle = Path.Circle(p, r);
			var segments = helperCircle.segments;
			helperCircle.remove();
			return segments;
		}
		
		this.segments = __segmentsGenerate(point, radius);
	}

}