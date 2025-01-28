class Pin extends Path {

	static inversionBulbRatio = 0.25
	static sideDict = ["right", "top", "left", "bottom"];

	constructor(circuit, pinData /*name, mode, side, offset, bulb, initial*/, device) {

		super();
		
		//console.log("creating pin for device",device.name,"in circuit",circuit.name," pindata=",pinData);

		this.circuit = circuit;
		this.side = pinData.side;
		this.data.type = "pin";
		this.name = pinData.name;
		this.mode = pinData.mode; // "in", "out" or "hi-z"
		this.label = (pinData.label === true)? pinData.name : pinData.label; // bool true -> make label same as name
		
		this.net = undefined;
		this.state = undefined;
		this.initial = pinData.initial; // undefined OK
		if (this.initial !== undefined)
			this.set(this.initial);

		
		this._addPathPoints(pinData, device);
		this.setStrokeColor(window.sim.appearance.color.undefined);
		this.setStrokeWidth(window.sim.appearance.size.wire);

		//this.place();
	}

	get device() {
		return this.parent.parent; // pin>pins>device
	}

	get sideName() {
		return Pin.sideDict[this.side];
	}

	get labelText() {
		
		var textOrientation = (this.side + this.device.orientation) % 4;

		var shift;
		switch (textOrientation)
		{
			case 0: shift = new Point(window.sim.grid*-0.3, window.sim.grid*0.3); break;
			case 1: shift = new Point(window.sim.grid* 0.3, window.sim.grid*0.3); break;
			case 2: shift = new Point(window.sim.grid* 0.3, window.sim.grid*0.3); break;
			case 3: 
			default: shift = new Point(window.sim.grid*0.3, window.sim.grid*-0.3); break;
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

	get base() {
		return this.segments[0].point;
	}

	get extent() {
		return this.segments[1].point;
	}

	get inversionBulb() { // returns a circle path to be used by device body constructor

		var pinLength = this.firstSegment.point.getDistance(this.lastSegment.point);
		var radius = pinLength * Pin.inversionBulbRatio;
		var center = this.firstSegment.point;
		var offset = this.firstSegment.point.subtract(this.lastSegment.point);
		return Path.Circle(center.subtract(offset.multiply(Pin.inversionBulbRatio)), radius);
	}

	get isConnected() {
		if (this.net)
			return true;
		return false;
	}

	_addPathPoints(pinData, device) {
		var pOrigin = device.corner[Devices.cornerNames[(device.orientation+1)%4]];;
		this.add(pOrigin);
		this.add(pOrigin.add(new Point(window.sim.grid, 0)));
		this.rotate(-90*((this.side + device.orientation)%4), pOrigin);
		var shift_x = (this.side % 2 == 1) * 1 + (this.side == 0) * device.packageData.body.dimensions.width;
		var shift_y = (this.side % 2 == 0) * 1 + (this.side == 3) * device.packageData.body.dimensions.height;
		this.side % 2 == 0? shift_y += pinData.offset : shift_x += pinData.offset;
		var shift = new Point(shift_x*window.sim.grid, shift_y*window.sim.grid);
		this.setPosition(this.position.add(shift.rotate(device.orientation*-90, new Point(0,0))));
	}

	_checkExtentJunction() {
		var junc = this.extent.findEditable({type:"junction"});
		console.log("found junc:", junc);
		if (junc) {
			if (this.net != junc.net)
				this.renet(junc.net);
			junc.radiusUpdate();
			return true;
		}
		console.log(this.net.name, this.net);
		junc = new Junction(this.extent, this.net);
		return false;
	}
	
	get() {
		return this.state;
	}

	set(state, color=null) {
		this.state = state;
		return state;
	}

	autoColor() {
		this.strokeColor = sim.appearance.color[this.state];
	}

	/*
	remove() {
		this.disconnect();
		super.remove();
	}

	connect(net) {
		net.connections.push(this);
		this.net = net;
	}

	renet(net) {
		console.log(`renetting pin: ${this.net.name} -> ${net.name}`);
		this.net.connections.splice(this.net.connections.indexOf(this), 1);
		this.net.removeIfEmpty();
		this.connect(net);
	}


	disconnect() {
		return this.renet(new Net(this.circuit));
	}
	*/

	renet(net) {
		console.log(`renetting junction from ${this.net? this.net.name: undefined} to ${net? net.name: undefined}`);
		if (this.net)
			this.net.connections.splice(this.net.connections.indexOf(this), 1);
		this.net = net;
		if (net)
			net.connections.push(this);
	}

	pick() {
		this.renet(undefined);
		var j = this.extent.findEditable({type:"junction"})
		if (j)
			j.radiusUpdate();
	}

	place() {
		this.renet(new Net(this.circuit));
		new Junction(this.extent, this.net);
		this.autoColor();
	}



}
