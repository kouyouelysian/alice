class Pin extends Path {

	constructor(circuit, pinData /*name, mode, side, offset, bulb, initial*/, device) {

		super();
		
		this.setStrokeColor(window.sim.appearance.color.undefined);
		this.setStrokeWidth(window.sim.appearance.size.wire);
		
		this.circuit = circuit;
		this.net = null;
		this.side = (pinData.side + device.orientation) % 4;
		this.data.type = "pin";
		this.name = pinData.name;
		this.mode = pinData.mode; // "in", "out" or "hi-z"
		this.state = undefined;
		this.initial = pinData.initial; // undefined OK
		if (this.initial !== undefined)
			this.set(this.initial);

		var packageDimensions = JSON.parse(JSON.stringify(device.packageData.body.dimensions));
		if (device.orientation % 2 != 0)
			[packageDimensions.width, packageDimensions.height] = [packageDimensions.height, packageDimensions.width];

		// mathematical shenanigans to find the position of the pin
		const hor = ((this.side+1)%2) * ((this.side>0)*-2+1);
		const vert  =(this.side%2) * ((this.side>1)*2-1);
		// offset by 1 cell left if top/bottom pin, offset by body width if pin is on the right
		var pinx = (this.side%2) + ((this.side==0) * packageDimensions.width);
		// offset by 1 cell down if left/right pin, offset by body height if pin is on the bottom
		var piny = ((this.side+1)%2) + ((this.side==3) * packageDimensions.height);
		// add offset vertically/horizontally to a horizontal/vertical pin respectively
		this.side%2==0? piny += pinData.offset : pinx += pinData.offset;
			 
		var start = new Point(device.position.x+pinx*window.sim.grid, device.position.y+piny*window.sim.grid);
		var end = start.add(new Point(hor*window.sim.grid, vert*window.sim.grid));

		this.add(start);
		this.add(end);

	}

	get device() {
		return this.parent.parent; // pin>pins>device
	}

	static sideDict = ["right", "top", "left", "bottom"];

	get sideName() {
		return Pin.sideDict[this.side];
	}

	set(state, color=null) {
		if (state == this.state)
			return state;
		this.state = state;
		if (color) // for fast recoloring on update
			this.strokeColor = color; 
		else
			this.autoColor();
		return state;
	}

	autoColor() {
		this.strokeColor = this.colorByState(this.state);
	}

	get() {
		return this.state;
	}

	colorByState(state) {
		if (state === true)
			return window.sim.appearance.color.true;
		else if (state === false)
			return window.sim.appearance.color.false;
		else
			return window.sim.appearance.color.undefined;
	}

	connect(net) {
		net.connectionAdd(this);
		this.net = net;
	}

	disconnect() {
		if (!this.net)
			return false;
		var index = this.net.connections.indexOf(this);
		if (index == -1)
			return false;
		this.net.connections.splice(index, 1);
		this.net = null;
		return true;
	}

	renet(net) { // alias
		connect(net);
	}

	place() {
		this.autoColor();
		var end = this.lastSegment.point;
		var junc = end.findEditable({type:"junction"});
		var wire = end.findEditable({type:"wire"});
		if (!(wire || junc)) // if neither found - no net to connect to
			return;

		if (junc)
		{
			this.connect(junc.net);
			junc.radiusUpdate();
		}
		else if (wire)
		{
			this.connect(wire.net);
			wire.splitAt(end);
		}
	}

	getInversionBulb(ratio=0.25) { // returns a circle path to be used by device body constructor
		var pinLength = this.firstSegment.point.getDistance(this.lastSegment.point);
		var radius = pinLength * ratio;
		var center = this.firstSegment.point;
		var offset = this.firstSegment.point.subtract(this.lastSegment.point);
		return Path.Circle(center.subtract(offset.multiply(ratio)), radius);
	}

	getLabel(text) {
		var point = this.firstSegment.point.add(new Point(window.sim.grid*-0.5, window.sim.grid*0.2))
		var label = new PointText(point);
		label.setStrokeColor("transparent");
		label.setStrokeWidth(0);
		label.setFillColor("black");
		label.fontWeight = "normal";
		label.fontSize = window.sim.grid * 0.8;
		label.justification = "right";
		label.content = "text";
		return label; 
	}

}
