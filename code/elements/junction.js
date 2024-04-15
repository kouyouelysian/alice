class Junction extends Path {
	
	constructor(point, net) {
		
		super();
		net.children["junctions"].addChild(this);
		
		this.net = net;
		this.data.type = "junction";
		this.closed = true;
		this.fillColor = net.color; // this.layer.data.style.color.undefined;
		this.add(point); // dummy segment at center until it gets circle'd
		this.radiusUpdate(point);


	}

	remove() {
		return super.remove();
	}

	renet(net) {
		net.children["junctions"].addChild(this);
	}

	radiusUpdate(point = this.position) {
		var radius = project.layers.editables.data.style.size.junction.normal;
		var wiresAtJunction = point.findEditable({type:"wire", all:true});
		if (wiresAtJunction && wiresAtJunction.length >= 3)
			var radius = project.layers.editables.data.style.size.junction.big;

		function __segmentsGenerate(p,r) {
			var helperCircle = Path.Circle(p, r);
			var segments = helperCircle.segments;
			helperCircle.remove();
			return segments;
		}
		
		this.segments = __segmentsGenerate(point, radius);

	}
	
	getWiresAt(options={exclude:null, sameNet:true}) {
		return this.position.findEditable({type:"wire", exclude:options.exclude, all:true, net:this.parent.parent});
	}

	removeWithWire(wire) {
		this.radiusUpdate();
		var wires = this.position.findEditable({type:"wire", all:true, exclude:wire, net:this.net});
		if (!wires)
			return this.remove();	
		if (wires.length != 2)
			return false;
		if (!wires[0].isParallel(wires[1]))
			return false;
		wires[0].mergeWith(wires[1]);
		return this.remove();		
	}
}