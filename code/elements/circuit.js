class Circuit extends Group {

	constructor() {

		super();
		this.name = "circuit";

		// paper.js stuff init
		this.editables = project.addLayer(new Layer({ name:"editables" }));
		var above = project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		this.editables.addChild(this);

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

		// update & timing stuff
		view.draw();
		view.autoUpdate = true;
		this.updateTimer = null;
		this.frameRate = 20; // ms
		this.ticksPerFrame = 1; // ticks

		// other stuff
		this.gridCursor = this._setupCursor();
	}

	run() {
		view.autoUpdate = false;
		if (!this.updateTimer)
			this.updateTimer = window.setInterval(function(){window.circuit.frame()}, window.circuit.frameRate)
	}

	stop() {
		clearTimeout(this.updateTimer);
		this.updateTimer = null;
		view.autoUpdate = true;
		this.ticks = 0;
	}

	frame() {
		for (var x = 0; x < this.ticksPerFrame; x++)
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


	_setupCursor() {
		project.layers.above.activate();
		var gc = new Path.Circle(new Point(GLOBAL_sizing/2, GLOBAL_sizing/2), this.appearance.size.cursor.radius);
		gc.strokeColor = this.appearance.color.selected;
		gc.strokeWidth = this.appearance.size.cursor.width;
		gc.name = 'gridCursor';		
		project.layers.editables.activate();
		return gc;
	}

	_selectionMake(item) {
		switch (item.data.type)
		{
			case "junction":
			case "wire":
			case "pin":
				item.strokeColor = this.appearance.color.selected;
				break;
			case "body":
				item.parent.setStrokeColor(this.appearance.color.selected);
				break;
		}
			
		return item;
		
	}

	_selectionClear(item) {
		
		if (item == null || item.parent == null)
			return false;

		switch (this.selection.data.type)
		{
			case "junction":
				item.fillColor = item.getNet().color;
			case "wire":
				item.strokeColor = item.getNet().color;
				return;
			case "pin":
				return item.autoColor();
			case "body":
				return item.parent.setStrokeColor(this.appearance.color.devices);
		}
	}

	_removeEditable() {
		if (!this.selection)
			return;
		if (this.selection.data.type == "body")
			return this.selection.parent.remove();
		this.selection.remove();
		this.selection = null;
		
	}
	
	_hitTestDouble(item, p1, p2) {
		var hit = item.hitTest(p1);
		if (hit != null)
			return hit;

		return item.hitTest(p2, { fill: true, stroke: true, segments: true, tolerance: GLOBAL_sizing*0.4 });
	}

	_toolSelect(key) {
		switch (key) {
				case 'w': this.tool = "wire"; return;
				case 'h': this.tool = "highlight"; return;
				case 'd': this.tool = "drag"; return;

				case 'a': this.tool = "And"; return;
				case 'o': this.tool = "Or"; return;
				case 'i': this.tool = "Not"; return;
				case 'n': this.tool = "Nand"; return;
				case '1': this.tool = "Nor"; return;
				case 'x': this.tool = "Xor"; return;

				case 's': this.tool = "Source"; return;
				case 'l': this.tool = "Light"; return;
				case 'c': this.tool = "Clock"; return;

				case 't': this.tool = "EightSegment"; return;

				case 'delete': this._removeEditable(); return;
			}
	}

	

	_actionStopAny() {
		if (this.status == "net") { // drawing a net
			if (this.tool == "wire") {
				this.wireNew.remove();
			}
		}
		else if (this.status == "device") {
			this.devicePicked.remove();
		}
		this.status = "idle";
	}

	_pointerClicked(point) {
		var actuator = point.findEditable({type:"actuator"});
		if (actuator) // if we clicked a button of some kind on some device
			actuator.data.device.act(actuator);
	}

	
	point(pointRaw, pointQuantized) { // called when a drawn cursor entered a new xcell, ycell position

		var hit = null;
		this.status == "idle"? hit = this._hitTestDouble(this.editables, pointQuantized, pointRaw)
			: hit = this.editables.hitTest(pointQuantized);	

		if (hit == null) {
			this._selectionClear(this.selection);
			return this.selection = null;
		}

		// prevent highlighting the wire we're currently drawing
		if (this.status == "net" && hit.item == this.wireNew)
			return;
		// prevent highlighting the device we picked
		else if (this.status == "device" && hit.item == this.devicePicked.children.body)
			return;

		if (hit.item != this.selection)
		{
			this._selectionClear(this.selection);
			this.selection = this._selectionMake(hit.item);
		}
	}
	
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

	click() { // called from gui clickbox onclick event

		const clickPoint = new Point(event.offsetX, event.offsetY);
		clickPoint.quantize(this.appearance.size.grid);

		if (this.status == "idle") {
			switch (this.tool)
			{
				case "drag":
					this.status = "drag";
					this._dragStart(clickPoint);
					return;
				case "wire":
					this.status = "net";
					this._selectionNetUnhighlight();
					return this.wireNew = new Wire(clickPoint, this);
				case "highlight":
					return this._selectionNetHighlight();
				case "pointer":
					return this._pointerClicked(clickPoint);

				default: // if that's not a tool, that's probably a device being placed
					this.status = "device";
					return this.devicePicked = new Devices[this.tool](this, clickPoint);
				
			}
		}
		else if (this.status == "net") 
		{	
			this.wireNew.finish(clickPoint); // finalise wire to how it must be
			if (Key.isDown('shift'))
				return this.wireNew = new Wire(clickPoint, this);
			this.wireNew
			this.status = "idle";
		}
		else if (this.status == "device")
		{
			this.devicePicked.place();
			this.devicePicked = null;
			this.status = "idle";
		}
		else if (this.status == "drag")
		{
			this._dragEnd();
		}
	}

	keyboard(input) {
		var key = input.toLowerCase();
		if (this.status == "idle")
		{
			if (this.tool != "pointer" && key == "escape")
				this.tool = "pointer";
			else
				this._toolSelect(key);
		}
		else 
		{
			if (key == "escape")
			{
				this._actionStopAny();		
			}
		}
	}	

	visualSchemeSet(scheme) {
		this.appearance = scheme;
		document.getElementById("simViewport").style.backgroundColor = scheme.color.fill;
	}


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
