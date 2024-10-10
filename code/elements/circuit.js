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
		
		// logic 
		this.status = "idle";
		this.tool = "pointer";
		this.selection = null;
		this.wireNew = null;
		this.netHighlighted = null;
		this.devicePicked = null;

		// other stuff
		this.integrationDetails = null;		
		this.isAnIC = false; // true if ran inside a chip
	}

	get devices() {
		return this.children.devices.children;
	}

	get nets() {
		return this.children.nets.children;
	}

	integrationInit() {
		this.integrationDetails = Devices.defaultPackageData;

		var counter = 0;
		for (var dev of this.devices) {
			if (dev.class != "ICPin")
				continue;
			this.integrationDetails.pins.push({
				name: dev.options.label.value,
				mode: "pass",
				side: 2 - ((counter % 2) * 2),
				offset: Math.floor(counter/2),
				label: dev.options.label.value
			});
			counter += 1;
		}
		
		this.integrationDetails.body.dimensions = {
			width: 8,
			height: 1+Math.ceil(counter/2)
		}
	}

	integrationRemove() {
		this.integrationDetails = null;
	}

	clone() {
		var json = this.export();
		var out = new Circuit();
		out.import(json);
		return out;
	}

	reset() {
		for (var d of this.devices)
			d.reset();
		
		for (var n of this.nets) {
			n.state = undefined;
			n.autoColor();
		}
	}

	frame() {
		var tpf = window.sim.meta.tpf;
		for (var c = 1; c <= tpf; c++)
		{
			for (var net of this.children["nets"].children) 
				net.tick();
			for (var dev of this.children["devices"].children) 
				dev.update();
		}
		for (var net of this.children["nets"].children) 
				net.frame();
	}


	
	rollByPrefix(property="name", prefix="dev") {
		var counter = -1;
		var ok;
		var rolledText = null;
		do 
		{
			counter += 1;
			ok = true;
			rolledText = `${prefix}${counter}`;
			for (var d of this.children.devices.children)
			{
				var v;
				try // very hacky, i know.. this is to support 'name' as well as 'property.label.value' etc
					{v = eval(`d.${property}`);}
				catch
					{continue;}
				if (rolledText == v)
					ok = false;
			}
		}
		while (!ok);
		return rolledText;
	}

	getDevicesByClass(fullClassString)
	{
		var out = [];
		for (var d of this.devices)
		{
			if (d.fullClass == fullClassString)
				out.push(d);
		}
		return out;
	}

	import(json) {

		this.name = json.name;
		// verify dependencies
		for (const deviceRecord of json.devices)
		{
			if (deviceRecord.class != "IntegratedCircuit.IC")
				continue;
			var emuCircName = deviceRecord.options.circuit.value;
			if (!window.sim.circuits.children[emuCircName]) 
			{
				window.sim.throwError(`The imported circuit uses an IC "${emuCircName} that was not found. Please, import it first."`);
				return HierarchyManager.circuit.delete(this.name);
			}
		}

		// import devices
		for (const deviceRecord of json.devices)
		{
			var parts = deviceRecord.class.split(".");
			var category = parts[0];
			var device = parts[1];
			
			var dev = new Devices[category][device](this,
				new Point(deviceRecord.origin.x, deviceRecord.origin.y));
			
			dev.import(deviceRecord);
		}

		// import nets
		for (const netRecord of json.nets) 
		{
			var net = new Net(this);
			net.import(netRecord);
		}

		this.integrationDetails = json.integration;
		if (this.integrationDetails)
			IcDesigner.addExplorerEntry(this);
	}

	export() {

		var json = {
			"name": this.name,
			"devices": [],
			"nets": [],
			"integration": this.integrationDetails
		}

		for (var d of this.children.devices.children)
			json.devices.push(d.export());

		for (var n of this.children.nets.children)
			json.nets.push(n.export());
	
		return json;
	}

}


