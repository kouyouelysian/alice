class Circuit extends Group {

	constructor(name=undefined, index=window.sim.circuits.getIndex()) {

		super();
		if (name)
			this.name = name;
		else
			this.name = "cir"+index.toString();

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
		this.integrationDetails = {};		
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

	import(json) {

		this.name = json.name;

		for (const deviceRecord of json.devices)
		{
			var parts = deviceRecord.class.split(".");
			var category = parts[0];
			var device = parts[1];
			var dev = new Devices[category][device](this,
				new Point(deviceRecord.position.x, deviceRecord.position.y));
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
				w.finish(new Point(wireRecord.finish.x, wireRecord.finish.y));
			}
		}
	}

	export() {

		var json = {
			"name": this.name,
			"devices": [],
			"nets": []
		}

		for (var d of this.children.devices.children)
			json.devices.push(d.export());

		for (var n of this.children.nets.children)
			json.nets.push(n.export());
	
		return json;
	}

}
