class Pin extends Path {

	static inversionBulbRatio = 0.25

	constructor(circuit, pinData /*name, mode, side, offset, bulb, initial*/, device) {

		super();
		
		this.setStrokeColor(window.sim.appearance.color.undefined);
		this.setStrokeWidth(window.sim.appearance.size.wire);
		
		this.circuit = circuit;
		this.net = null;
		this.side = pinData.side;
		this.data.type = "pin";
		this.name = pinData.name;
		this.mode = pinData.mode; // "in", "out" or "hi-z"
		this.label = pinData.label;
		this.state = undefined;
		this.initial = pinData.initial; // undefined OK
		if (this.initial !== undefined)
			this.set(this.initial);

		var pOrigin = device.corner[Devices.cornerNames[(device.orientation+1)%4]];;
		this.add(pOrigin);
		this.add(pOrigin.add(new Point(window.sim.grid, 0)));
		this.rotate(-90*((this.side + device.orientation)%4), pOrigin);
		var shift_x = (this.side % 2 == 1) * 1 + (this.side == 0) * device.packageData.body.dimensions.width;
		var shift_y = (this.side % 2 == 0) * 1 + (this.side == 3) * device.packageData.body.dimensions.height;
		this.side % 2 == 0? shift_y += pinData.offset : shift_x += pinData.offset;
		var shift = new Point(shift_x*window.sim.grid, shift_y*window.sim.grid);
		this.setPosition(this.position.add(shift.rotate(device.orientation*-90, new Point(0,0))));

		this.place();
	}

	get device() {
		return this.parent.parent; // pin>pins>device
	}

	static sideDict = ["right", "top", "left", "bottom"];

	get sideName() {
		return Pin.sideDict[this.side];
	}

	get labelText() {
		
		var textOrientation = (this.side + this.device.orientation) % 4;

		var shift;
		switch (textOrientation)
		{
			case 0: shift = new Point(window.sim.grid*-0.3, window.sim.grid*0.2); break;
			case 1: shift = new Point(window.sim.grid* 0.2, window.sim.grid*0.3); break;
			case 2: shift = new Point(window.sim.grid* 0.3, window.sim.grid*0.2); break;
			case 3: 
			default: shift = new Point(window.sim.grid*0.2, window.sim.grid*-0.3); break;
		}
		var point = this.firstSegment.point.add(shift);
		

		var label = new PointText(point);
		if (textOrientation % 2 == 1)
			label.rotate(-90, point);

		label.setStrokeColor("transparent");
		label.setStrokeWidth(0);
		label.setFillColor("black");
		label.fontWeight = "normal";
		label.fontSize = window.sim.grid * 0.8;

		textOrientation >= 2?
			label.justification = "left" : 
			label.justification = "right";
		
		label.content = this.label? this.label : "text";
		return label; 
	}

	get inversionBulb() { // returns a circle path to be used by device body constructor

		var pinLength = this.firstSegment.point.getDistance(this.lastSegment.point);
		var radius = pinLength * Pin.inversionBulbRatio;
		var center = this.firstSegment.point;
		var offset = this.firstSegment.point.subtract(this.lastSegment.point);
		return Path.Circle(center.subtract(offset.multiply(Pin.inversionBulbRatio)), radius);
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

	remove() {
		this.disconnect();
		super.remove();
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

	

	

}
