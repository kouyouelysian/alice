var Devices = {

	defaultPackageData: {
		"pins": [
			{"name":"o", "mode":"out", "side":0, "offset":0}
		],
		"body": {
			"origin": {
				x:1,
				y:1
			},
			"dimensions": {
				"width": 2,
				"height": 2
			},
			"symbol": null,
			"label": null
		}
	}	

	/* other devices from /code/devices/* added here as to a dict  */
}

Devices.Device = class Device extends Group {

	constructor(parentGroup, point, packageData=Devices.defaultPackageData) {

		super();

		this.position = point;

		this.name = "dev"+parentGroup._getIndex();
		parentGroup.addChild(this);
		this.data.type = "device"; 

		this.pivot = this.bounds.topLeft;
		this.createPackage(point, packageData);
	}	

	remove() {
		this.parent._freeIndex(this.name);
		super.remove();
	}
	
	createPackage(point, packageData) {

		var sizing = this.layer.data.style.size.grid;
		var origin = new Point(
			point.x - packageData.body.origin.x*sizing, 
			point.y - packageData.body.origin.x*sizing
		);

		for (const pinData of packageData.pins)
		{
			this.addChild(new Pin(pinData, packageData.body.dimensions, origin, sizing));
			if (pinData.bulb)
				this.addChild(this.lastChild.getInversionBulb());
		}

		if (!packageData.body.symbol) // if package has no symbol information - draw a rectangle
			this.insertChild(packageData.pins.length, this.createBodyDefault(packageData, origin, sizing));
		else // else we have custom package information, then process it
			this.insertChild(packageData.pins.length, this.createBodyCustom(packageData, origin, sizing));
		
		this.lastChild.name = "body";
		this.lastChild.type = "body";

		this.setStrokeColor(project.layers.editables.data.style.color.devices);
		this.setStrokeWidth(project.layers.editables.data.style.size.device);
		this.setFillColor(project.layers.editables.data.style.color.fill);
	}

	createBodyDefault(packageData, origin, sizing) {
		var body = new Path.Rectangle(origin.x, origin.y, packageData.body.dimensions.width*sizing, packageData.body.dimensions.height*sizing)
		body.strokeColor = body.parent.strokeColor;
		return body;
	}

	createBodyCustom(packageData, origin, sizing) {
		//body = new Path.Circle(origin, 10);

			var body = new CompoundPath();
			body.position = origin;
			
			for (var pieceData of packageData.body.symbol)
			{
				var piece = new Path();
				for (var segment of pieceData.segmentData)
				{
					var point = origin.add(this.pointFromPackageNotation(segment.point, sizing));
					piece.add(point);
					if (segment.handles)
					{
						piece.lastSegment.handleIn = this.pointFromPackageNotation(segment.handles.in, sizing);
						piece.lastSegment.handleOut = this.pointFromPackageNotation(segment.handles.out, sizing);
					}
				}
				if (pieceData.closed)
					piece.closed = true;
				if (pieceData.smooth)
					piece.smooth("continuous");
				else
					piece.fillColor = "transparent";
				body.addChild(piece);
			}
			
			return body;
	}

	pointFromPackageNotation(pdn, sizing) {
		return new Point(pdn[0], pdn[1]).multiply(sizing);
	}

	read(pinName) {
		return this.children[pinName].get();
	}

	write(pinName, state) {
		this.children[pinName].set(state);
 	}

 	toggle(pinName) {
 		if (this.children[pinName].state == undefined)
 			return;
 		this.children[pinName].set(!this.children[pinName].get());
 	}

 	act(actuator) { // fires when the item's actuator has been pressed
 		return;
 	}

	update() { // updates the device's outputs based on its inputs
		return;
	}
}
