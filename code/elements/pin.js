class Pin extends Path {

	constructor(pinData /*name, mode, side, offset, bulb*/, packageDimensions, origin, sizing) {

		// mathematical shenanigans to find the position of the pin
		const hor = ((pinData.side+1)%2) * ((pinData.side>0)*-2+1);
		const vert  =(pinData.side%2) * ((pinData.side>1)*2-1);
		// offset by 1 cell left if top/bottom pin, offset by body width if pin is on the right
		var pinx = (pinData.side%2) + ((pinData.side==0) * packageDimensions.width);
		// offset by 1 cell down if left/right pin, offset by body height if pin is on the bottom
		var piny = ((pinData.side+1)%2) + ((pinData.side==3) * packageDimensions.height);
		// add offset vertically/horizontally to a horizontal/vertical pin respectively
		pinData.side%2==0? piny += pinData.offset : pinx += pinData.offset;
			 
		var start = new Point(origin.x+pinx*sizing, origin.y+piny*sizing);
		var offset = new Point(hor*sizing, vert*sizing);

		super();
		this.add(start);
		this.add(start.add(offset));
		this.data.type = "pin";
		this.name = pinData.name;
		this.mode = pinData.mode; // "in", "out" or "hi-z"
		this.net = null;
		this.fillColor = "white";//this.layer.data.style.color.fill;
		this.state = undefined;
	}

	get() {
		return this.state;
	}

	set(state) {
		if (state == this.state)
			return;
		this.state = state;
		this.colorByState(this.state);
	}

	colorByState(state) {
		if (state === true)
			this.strokeColor = (this.layer.data.style.color.true);
		else if (state === false)
			this.strokeColor = (this.layer.data.style.color.false);
		else
			this.strokeColor = (this.layer.data.style.color.undefined);
	}

	connect(net) {
		this.net = net;
	} 

	disconnect() {
		this.net = null;
	}

	getInversionBulb(ratio=0.25) {
		var pinLength = this.firstSegment.point.getDistance(this.lastSegment.point);
		var radius = pinLength * ratio;
		var center = this.firstSegment.point;
		var offset = this.firstSegment.point.subtract(this.lastSegment.point);
		return Path.Circle(center.subtract(offset.multiply(ratio)), radius);
	}

}