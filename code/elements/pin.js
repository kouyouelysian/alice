class Pin extends Path {

	static inversionBulbRatio = 0.25
	static sideDict = ["right", "top", "left", "bottom"];

	constructor(circuit, pinData /*name, mode, side, offset, bulb, initial*/, device) {

		super();
		
		//console.log("creating pin for device",device.name,"in circuit",circuit.name," pindata=",pinData);

		this.circuit = circuit;
		this.net = null;
		this.side = pinData.side;
		this.data.type = "pin";
		this.name = pinData.name;
		this.mode = pinData.mode; // "in", "out" or "hi-z"
		this.label = (pinData.label === true)? pinData.name : pinData.label; // bool true -> make label same as name
		
		this.state = undefined;
		this.initial = pinData.initial; // undefined OK
		if (this.initial !== undefined)
			this.set(this.initial);

		this._getInitialNet();
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

	_getInitialNet() {
		if (!this.circuit)
			return; // fuck off if this is IC editor
		var net = new Net(this.circuit);
		this.connect(net);
		return;
	}

	_checkExtentJunction() {
		var junc = this.extent.findEditable({type:"junction"});
		console.log("found junc:", junc);
		if (junc) {
			this.renet(junc.net);
			junc.radiusUpdate();
			return true;
		}
		junc = new Junction(this.extent, this.net);
		return false;
	}
	
	set(state, color=null) {
		this.state = state;
		return state;
	}

	autoColor() {
		this.strokeColor = sim.appearance.color[this.state];
	}

	get() {
		return this.state;
	}

	remove() {
		//this.disconnect();
		super.remove();
	}

	connect(net) {
		net.connectionAdd(this);
		this.net = net;
	}

	disconnect() {
		this.renet(new Net(this.circuit));
	}

	renet(net) {
		if (this.net)
			this.net.connectionRemove(this);
		this.connect(net);
	}

	pick() {
		
		/*
		var wires = this.extent.findEditable({type:"wire", all:true, net:this.net});
		var junc = this.extent.findEditable({type:"junction", net:this.net});
		
		if (!wires)
			return;

		this.disconnect();

		junc.radiusUpdate();
		
		
		for (var w of wires)
		{
			if (w.mergeAt(this.extent))
				return;
		}
		*/
		this.disconnect();
		var junc = this.extent.findEditable({type:"junction"});
		if (junc)
			junc.radiusUpdate();
	}

	

	place() {

		var junc = this.extent.findEditable({type:"junction"});
		var wire = this.extent.findEditable({type:"wire"});
		var pin = this.extent.findEditable({type:"pin", exclude:this});

		// if neither found - no net to connect to; create new net and become part of it
		/*
		if (!(wire || junc || pin) && !this.isConnected)
		{
			var net = new Net(this.circuit);
			this.connect(net);
			return;
		}
		*/

		// else connect to the existing net
		/*if (this.net) // if we're placing a pin its net only contains the pin
		{
			this.disconnect();
			this.net.remove();
		}*/

		console.log("pins found:", pin);

		if (this._checkExtentJunction())
			return;

		if (wire)
		{
			this.renet(wire.net);
			//wire.splitAt(end);
		}

		/*else if (pin) {

			this.renet(pin.net);
		}*/

		this.autoColor();
	}



}
