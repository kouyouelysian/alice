class Circuit extends Group {

	constructor(index=0) {

		super();
		this.name = "cir"+index.toString();

		// paper.js stuff init
		/*
		this.editables = project.addLayer(new Layer({ name:"editables" }));
		var above = project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		this.editables.addChild(this);
		*/

		project.layers.editables.addChild(this);

		// main subgroups
		var nets = new IndexedGroup();
		var devices = new IndexedGroup();
		nets.name = "nets";
		devices.name = "devices";
		this.addChild(nets);	
		this.addChild(devices);
		
		// style definitions
		this.appearance = VisualSchemes.default;

		// logic 
		this.status = "idle";
		this.tool = "pointer";
		this.selection = null;
		this.wireNew = null;
		this.netHighlighted = null;
		this.devicePicked = null;

		

		// other stuff
	}

	

	frame() {
		//for (var x = 0; x < this.ticksPerFrame; x++)
		{
			for (var net of this.children["nets"].children) 
				net.update();
			for (var dev of this.children["devices"].children) 
				dev.update();
		}
		view.update();
	}

	benchmark(laps=1000*this.ticksPerFrame)
	{
		var timeStack = 0;
		for (var x = 0; x < laps; x++)
		{
			var startTime = performance.now()
			this.update()   // <---- measured code goes between startTime and endTime
			var endTime = performance.now()
			timeStack += endTime - startTime;
		}
		console.log("average of", laps, "circuit update times:", timeStack/laps, "milliseconds.")
	}

	throwError(text) {
		this.stop();
		alert(text);
	}

	/*

	

	

	
	_selectionNetHighlight() {
		this._selectionNetUnhighlight();
		if (this.selection == null)
			return;
		this.netHighlighted = this.selection.getNet();
		return this.selection.parent.parent.highlight();
	}

	_selectionNetUnhighlight() {
		if (!this.netHighlighted)
			return;
		this.netHighlighted.unhighlight();
		this.netHighlighted = null;
	}

	_dragStart(point) {
		var firstEditable = point.findEditable();
		if (!firstEditable)
			return;
		var editables = point.findEditable({all:true, net:firstEditable.getNet()});
		for (var e of editables)
			e.strokeColor = "red";
	}	

	_dragEnd() {
		this.status == "idle";
	}

	*/

	


	export(pretty=false) {
		var json = {
			"devices": [],
			"nets": []
		}

		var indent = 0;
		if (pretty)
			indent = 4;

		for (var d of this.children.devices.children)
			json.devices.push(d.export());

		for (var n of this.children.nets.children)
			json.nets.push(n.export());
	
		return JSON.stringify(json, null, indent);

		
	}

	import(jsonString) {

		const json = JSON.parse(jsonString);

		for (const deviceRecord of json.devices)
		{
			var dev = new (eval("Devices."+deviceRecord.class))(
				this,
				new Point(deviceRecord.position.x, deviceRecord.position.y)
				);
			dev.name = deviceRecord.name;
		}

		for (const netRecord of json.nets) 
		{
			var net = new Net(this);
			net.name = netRecord.name;
			for (const wireRecord of netRecord.wires)
			{
				var w = new Wire(
					new Point(wireRecord.start.x, wireRecord.start.y),
					this
					);
				w.finish(new Point(wireRecord.finish.x, wireRecord.finish.y))
			}
		}
	}
}
