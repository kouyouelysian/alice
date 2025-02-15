class Sim {

	constructor(sizing) {

		// project metadata

		this.meta = {
			name: "project",
			fps: 30,
			tpf: 10
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
		this.hotkeysActive = false;

		// logic
		this.status = undefined;
		this.tool = undefined;
		this.setTool("pointer");
		this._setStatus("idle");
		this.editedElement = null;
		this.selection = null;
		this.updateInterval = null;
		this.frameRate = null;
		this.ticksPerFrame = null;

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

		if (opts.key && this.hotkeysActive)
		{
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
		if (editable.data.type == "actuator")
			return editable.data.device.act(editable);
		Details.show(editable);

	}
	_actionStart(point) {

		if (this.circuit.netHighlighted)
			this.circuit.netHighlighted.unhighlight();

		switch (this.tool) { // first figure out if this is some core action

			case "pointer":
				return this._pointerClicked(point);

			case "wire":
				this._setStatus("wiring");
				return this.editedElement = new Wire(point, this.circuit);

			case "highlight":
				var editable = point.findEditable();
				if (!editable)
					return;
				editable.net.highlight();
				return this.circuit.netHighlighted = editable.net;

			case "drag":

				var editable = this.selection;
				if (!editable)
					editable = point.findEditable();
				if (!editable)
					return;

				var target = null;
				switch (editable.data.type)
				{
					case "bodyPart":
					case "actuator":
						target = editable.parent.parent;
						break;
					case "pin":
						target = editable.device;
						break;
					case "body":
						target = editable.parent;
						break;
					case "junction":
					case "device":
						target = editable;
						break;
					case "wire":
						target  =editable.splitAt(editable.middle);
						target.reposition(point);
						break;
					default:
						return;

				}
				
				target.pick();
				this._setStatus("dragging");
				this.editedElement = target;
				return;
		}

		// if not a core action, then a device is being added
		this._setStatus("adding device");

		// check if it's an integrated circuit
		if (this.tool.indexOf("IntegratedCircuit") != -1)
		{
			this.editedElement = new Devices.IntegratedCircuit.IC(
				this.circuit,
				point,
				this.tool.split(".")[1]
				);
			return Details.device.show(this.editedElement);
		}

		// usual device from a library then 
		var deviceGroup = Devices[this.tool.split(".")[0]];
		if (!deviceGroup)
			return;
		
		var deviceClass = deviceGroup[this.tool.split(".")[1]];
		if (!deviceClass)
			return;
		
		this.editedElement = new deviceClass(this.circuit, point);
		return Details.device.show(this.editedElement);


	}

	_actionFinish(point) {
		switch (this.status) {
			case "wiring":
				this.editedElement.finish(point); // finalise wire to how it must be
				if (Key.isDown('shift'))
					return this.editedElement = new Wire(point, this.circuit);
				break;
			
			case "adding device":
			case "dragging":
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
			case "actuator":
				return undefined;
			default:
				return item;
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
			case "dragging":
				break;
		}
		Details.circuit.show(this.circuit);
		this._setStatus("idle");
	}

	run() {

		if (HierarchyManager.windowActive != "simViewport")
			return;
		
		this.reset();
		this._setStatus("running");
		this.setTool("pointer");
		Details.setReadOnly(true);
		paper.view.autoUpdate = false;
		this.frameRate = 1000*(1/this.meta.fps);
		this.ticksPerFrame = this.meta.tpf;

		if (!this.updateInterval)
		{
			this.updateInterval = window.setInterval(function() 
			{
				window.sim.circuitActive.frame();
				paper.view.update();

			}, this.frameRate);
		}
		
	}

	benchmark(laps=25000)
	{
		var timeStack = 0;
		for (var x = 0; x < laps; x++)
		{		
			var startTime = performance.now()
			window.sim.circuitActive.frame();
			paper.view.update();
			var endTime = performance.now()
			timeStack += endTime - startTime;
		}
		alert(`average of ${laps} circuit frame times: ${timeStack/laps*1000} us`);
	}


	stop() {
		this._setStatus("idle");
		clearInterval(this.updateInterval);
		this.updateInterval = null;
		paper.view.autoUpdate = true;
		this.ticks = 0;
		Details.setReadOnly(false);
	}

	reset() {

		if (this.status != "idle")
			return;
		this.circuit.reset();
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
			return this.devicePicked.position = quantized;
		// prevent rehighlighting the selection we already have
		if (hit.item == this.selection)
			return;

		this._selectionClear(this.selection);
		this.selection = this._selectionMake(hit.item);
		
	}

	click(event) {
		const p = new Point(event.offsetX, event.offsetY);
		p.quantize(this.appearance.size.grid);
		if (this.status == "running")
			return this._pointerClicked(p);
		if (this.status == "idle")
			return this._actionStart(p);
		return this._actionFinish(p);
	}

	rclick(event) {
		event.preventDefault();
		event.stopPropagation();
		if (this.status == "adding device")
			return this.editedElement.reorient();
		ContextMenu.show(event);
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
				case "dragging":
					return window.sim.editedElement.reposition(quantizedPoint);
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
