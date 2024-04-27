class Sim {

	constructor(sizing) {

		// paper.js stuff
		project.addLayer(new Layer({ name:"editables" }));
		project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		view.draw();
		view.autoUpdate = true;

		// circuit system
		this.circuits = new IndexedGroup();
		this.activeCircuitIndex = 0;
		this.circuitAdd();

		// appearance, actual gui
		this.appearance = VisualSchemes.default;
		this.cursor = this._setupCursor();
		this.pageParts = {
			viewport: document.getElementById("simViewport"),
			status: document.getElementById("displayStatus"), 
			tool: document.getElementById("displayTool")
		}

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
	}

	circuitAdd() {
		this.circuits.addChild( new Circuit(this.circuits._getIndex()) );
	}

	circuitRemove(name) {
		this.circuits.children[name].remove();
	}

	circuitActiveGet() {
		return this.circuits.children[this.activeCircuitIndex];
	}

	circuitActiveSet(name) {
		this.activeCircuitIndex = this.circuits.children[name].index;
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

			case "s": return this.setTool("Source");
			case "l": return this.setTool("Light");
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
			case "device":
			return this.pageParts.viewport.setAttribute("style", "cursor: crosshair;");
			case "drag":
			return this.pageParts.viewport.setAttribute("style", "cursor: grab;");
		}
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
		var editable = point.findEditable(); // 
		if (editable.data.isActuator) // if we clicked a button of some kind on some device
			editable.data.device.act(editable);
	}
	_actionStart(point) {
		switch (this.tool) { // first figure out if this is some core action
			case "wire":
				this._setStatus("wiring");
				return this.editedElement = new Wire(point, this.circuitActiveGet());

			case "pointer":
				return this._pointerClicked(point);
		}

		// if not - check if this is a device that exists
		var classPointer = Devices[this.tool.split(".")[0]][this.tool.split(".")[1]];
		if (classPointer == null)
			return;
		this._setStatus("adding device");
		return this.editedElement = new classPointer(this.circuitActiveGet(), point);
	}

	_actionFinish(point) {
		switch (this.status) {
			case "wiring":
				this.editedElement.finish(point); // finalise wire to how it must be
				if (Key.isDown('shift'))
					this.editedElement = new Wire(point, this.circuitActiveGet());
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
				item.parent.setStrokeColor(this.appearance.color.selected);
				break;
		}
		return item;	
	}

	_selectionColorBack(item) {
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
		this._setStatus("running");
		this.setTool("pointer");
		view.autoUpdate = false;
		if (!this.updateInterval)
		{
			this.updateInterval = window.setInterval(function() 
			{
				window.sim.circuitActiveGet().frame();
			}, this.frameRate);
		}
	}

	stop() {
		this._setStatus("idle");
		clearInterval(this.updateInterval);
		this.updateInterval = null;
		view.autoUpdate = true;
		this.ticks = 0;
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
		else if (key == "delete")
			return this._removeEditable();
		return this._pickTool({key:key})
	}

	visualSchemeSet(scheme) {
		this.appearance = scheme;
		document.getElementById("simViewport").style.backgroundColor = scheme.color.fill;
	}

}
