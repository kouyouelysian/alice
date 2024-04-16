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
		console.log("junc", this.index, "removed from", this.getNet().name);
		console.trace();
		return super.remove();
	}

	radiusUpdate(notCount=null, point = this.position) {

		var radius = project.layers.editables.data.style.size.junction.normal;

		var wiresAtJunction = point.findEditable({type:"wire", all:true, exclude:notCount});
		if (!wiresAtJunction)
			this.remove(); // if ran out of wires at this junction - remove self

		var count = 0;
		if (wiresAtJunction)
			count = wiresAtJunction.length;
		if (point.findEditable({type:"pin", all:true}))
			count += 1;

		if (count >= 3)
			var radius = project.layers.editables.data.style.size.junction.big;

		function __segmentsGenerate(p,r) {
			var helperCircle = Path.Circle(p, r);
			var segments = helperCircle.segments;
			helperCircle.remove();
			return segments;
		}
		
		this.segments = __segmentsGenerate(point, radius);
	}

}