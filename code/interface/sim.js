class Sim {

	constructor(sizing) {

		// paper.js stuff
		project.addLayer(new Layer({ name:"editables" }));
		project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		view.draw();
		view.autoUpdate = true;

		// project metadata

		this.meta = {
			"name":"project"
		}

		// circuit system
		this.circuits = new IndexedGroup();
		this.activeCircuitIndex = null;
		

		// appearance, actual gui
		this.appearance = VisualSchemes.default;
		this.cursor = this._setupCursor();
		this.pageParts = {
			viewport: document.getElementById("simViewport"),
			status: document.getElementById("displayStatus"), 
			tool: document.getElementById("displayTool")
		}
		this.activeWindow = null;

		// logic
		this.status = undefined;
		this.tool = undefined;
		this.setTool("pointer");
		this._setStatus("idle");
		this.editedElement = null;
		this.selection = null;
		this.updateInterval = null;
		this.frameRate = 20; // ms
		this.ticksPerFrame = 1; // ticks

		// notes system
		this.notes = {};

	}

	get grid() {
		return this.appearance.size.grid;
	}

	get circuit() {
		return this.circuits.children[this.activeCircuitIndex];
	}

	get circuitActive() {
		return this.circuits.children[this.activeCircuitIndex];
	}

	set circuitActive(name) {
		this.activeCircuitIndex = this.circuits.children[name].index;
	}

	circuitActiveSet(name) {
		this.activeCircuitIndex = this.circuits.children[name].index;
	}

	circuitMakeVisible(name) {
		for (var c of this.circuits.children)
			c.name == name? c.visible = true : c.visible = false;
		this.circuitActive = name;
	}

	_pickTool(opts={/* key, name */}) {
		if (opts == {})
			return; // at least one has to be set

		if (opts.name) // tool by name has prevalence
			return setTool(opts.name);

		switch (opts.key)
		{
			case "w": return this.setTool("wire");
			case "d": return this.setTool("drag");
			case "p": return this.setTool("pointer");
			case "h": return this.setTool("highlight");

			case "s": return this.setTool("Interfaces.Source");
			case "l": return this.setTool("Interfaces.Light");
		}

	}

	setTool(tool) {
		this.pageParts.tool.innerHTML = "Tool: <b>" + tool.toLowerCase() + "</b>";
		this.tool = tool;
		switch (tool) {
			case "pointer":
			case "highlight": 
			return this.pageParts.viewport.removeAttribute("style");
			case "wire": 
			return this.pageParts.viewport.setAttribute("style", "cursor: crosshair;");
			case "drag":
			return this.pageParts.viewport.setAttribute("style", "cursor: grab;");
		}
		if (tool.indexOf(".") != -1) // if it's a device
			return this.pageParts.viewport.setAttribute("style", "cursor: grabbing;");
	}

	_setStatus(status) {
		this.pageParts.status.innerHTML = "Status: <b>" + status.toLowerCase() + "</b>";
		this.status = status;
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

	_hitTestDouble(item, p1, p2) {
		var hit = item.hitTest(p1);
		if (hit != null)
			return hit;
		return item.hitTest(p2, { fill: true, stroke: true, segments: true, tolerance: GLOBAL_sizing*0.4 });
	}

	_pointerClicked(point) {
		var editable = point.findEditable(); 
		if (!editable) // if we clicked a button of some kind on some device
			return;
		if (editable.data.isActuator)
			return editable.data.device.act(editable);
		Details.show(editable);

	}
	_actionStart(point) {

		if (this.circuit.netHighlighted)
			this.circuit.netHighlighted.unhighlight();

		switch (this.tool) { // first figure out if this is some core action
			case "wire":
				this._setStatus("wiring");
				return this.editedElement = new Wire(point, this.circuit);

			case "pointer":
				return this._pointerClicked(point);

			case "highlight":
				var editable = point.findEditable();
				if (!editable)
					return;
				editable.net.highlight();
				return this.circuit.netHighlighted = editable.net;
		}

		// if not - check if this is a device that exists
		var deviceGroup = Devices[this.tool.split(".")[0]];
		if (!deviceGroup)
			return;

		var deviceClass = deviceGroup[this.tool.split(".")[1]];
		if (!deviceClass)
			return;

		this._setStatus("adding device");
		return this.editedElement = new deviceClass(this.circuit, point);
	}

	_actionFinish(point) {
		switch (this.status) {
			case "wiring":
				this.editedElement.finish(point); // finalise wire to how it must be
				if (Key.isDown('shift'))
					return this.editedElement = new Wire(point, this.circuit);
				break;
			
			case "adding device":
				this.editedElement.place();
				this.editedElement = null;
				break;
		}
		this._setStatus("idle");
	}

	_removeEditable() {
		if (!this.selection)
			return;
		if (this.selection.data.type == "body")
			return this.selection.parent.remove();
		this.selection.remove();
		this.selection = null;
		
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
			case "bodyPart":
				var p;
				item.data.type=="body"? p=item.parent : p=item.parent.parent;
				p.recolor(this.appearance.color.selected);
				return p;
		}
		return item;	
	}

	_selectionColorBack(item) {

		switch (this.selection.data.type)
		{
			case "junction":
				item.fillColor = item.net.color;
			case "wire":
				item.strokeColor = item.net.color;
				return;
			case "pin":
				return item.autoColor();
			case "device":
				item.recolor(this.appearance.color.devices);
				for (var p of item.children["pins"].children) {
					p.autoColor();
				}
				return;
	
				
		}
	}

	_selectionClear(item) {
		if (item == null || item.parent == null)
			return false;
		this._selectionColorBack(item);
		this.selection = null;		
	}

	_actionStopAny() {
		switch (this.status) {
			case "wiring":
			case "adding device":
				this.editedElement.remove();
				break;
		}
		this._setStatus("idle");
	}

	run() {
		if (HierarchyManager.windowActive != "simViewport")
			return;
		this.reset();
		this._setStatus("running");
		this.setTool("pointer");
		view.autoUpdate = false;
		if (!this.updateInterval)
		{
			this.updateInterval = window.setInterval(function() 
			{
				window.sim.circuitActive.frame();
			}, this.frameRate);
		}
		Details.setReadOnly(true);
	}

	stop() {
		this._setStatus("idle");
		clearInterval(this.updateInterval);
		this.updateInterval = null;
		view.autoUpdate = true;
		this.ticks = 0;
		Details.setReadOnly(false);
	}

	reset() {
		for (var d of this.circuit.children["devices"].children) {
			d.reset();
		}
		
		for (var n of this.circuit.children["nets"].children) {
			n.state = undefined;
			n.colorByState();
		}
	}

	point(raw, quantized) {
		var hit = null;
		this.status == "idle"? hit = this._hitTestDouble(project.layers.editables, quantized, raw)
			: hit = project.layers.editables.hitTest(quantized);	

		if (hit == null)
			return this._selectionClear(this.selection);

		// prevent highlighting the wire we're currently drawing
		if (this.status == "net" && hit.item == this.wireNew)
			return;
		// prevent highlighting the device we picked
		if (this.status == "device" && hit.item == this.devicePicked.children.body)
			return;
		// prevent rehighlighting the selection we already have
		if (hit.item == this.selection)
			return;

		this._selectionClear(this.selection);
		this.selection = this._selectionMake(hit.item);
		
	}

	click() {
		const p = new Point(event.offsetX, event.offsetY);
		p.quantize(this.appearance.size.grid);
		if (this.status == "running")
			return this._pointerClicked(p);
		if (this.status == "idle")
			return this._actionStart(p);
		return this._actionFinish(p);
	}

	key(key) {
		if (this.status == "running")
			return; // only pointer allowed while running
		if (key == "escape" && tool != "pointer")
		{
			this._actionStopAny();
			return this.setTool("pointer");
		}
		else if (key == "delete" || key == "backspace")
			return this._removeEditable();
		return this._pickTool({key:key})
	}

	visualSchemeSet(scheme) {
		this.appearance = scheme;
		document.getElementById("simViewport").style.backgroundColor = scheme.color.fill;
	}

	throwError(text="error!") {
		this.stop();
		window.alert(text);
	}	

	noteJSON(name, text) {
		return {"name":name, "text":text};
	}

	setupTool() {

		var tool = new Tool();
		tool.minDistnace = 4;

		tool.onMouseMove = function(event) {
			const quantizedPoint = new Point(
				event.point.x,
				event.point.y
				);
			quantizedPoint.quantize(window.sim.appearance.size.grid);
			if (!window.sim.cursor.position.isClose(quantizedPoint, 1)) {
				window.sim.cursor.position = quantizedPoint;
				window.sim.point(event.point, quantizedPoint);
			}
			switch (window.sim.status) {
				case "wiring":
					return window.sim.editedElement.lastSegment.point = event.point;
				case "adding device":
					return window.sim.editedElement.position = quantizedPoint;
			}
		}

		tool.onKeyDown = function(event) {	
			window.sim.key(event.key);
		}

		return tool;
	}

	export() {
		var json = {
			"circuits": [],
			"notes": [],
			"meta": this.meta
		}
		for (var cir of this.circuits.children)
			json.circuits.push(cir.export());
		for (var noteName in this.notes)
		{
			if (noteName == "instructions")
				continue;
			json.notes.push(this.noteJSON(noteName, this.notes[noteName]));
		}
		return json;
	}

	import(json) {
		this.meta = json.meta;
		this.circuits.clear();
		this.notes = {"instructions":this.notes.instructions};
		for (var cir of json.circuits)
		{
			var circuit = new Circuit();
			this.circuits.addChild(circuit);
			this.circuitMakeVisible(circuit.name);
			circuit.import(cir);
			Explorer.itemAdd("circuit", cir.name);
		}
		

		for (var n of json.notes)
		{
			this.notes[n.name] = n.text;
			Explorer.itemAdd("note", n.name);
		}
	}

	onload() {
		this.activeCircuitIndex = 0;
		this.setupTool();
		document.getElementById('simCanvas').scrollIntoView({
			block: 'center',
			inline: 'center',
			behavior: 'auto'
		}); 
		bmco.httpRequest("./data/manual.html").then((data) => {
			var htmlText = data.substring(data.indexOf("<article>")+9, data.indexOf("</article>")).replaceAll("\n\t", "\n");
			this.notes["instructions"] = btoa(htmlText);
		}); 
	}

}
