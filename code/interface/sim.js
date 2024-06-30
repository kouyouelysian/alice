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
		this.notes = {
			"instructions": "PGgxPkFMSUNFIGluc3RydWN0aW9uIG1hbnVhbDwvaDE+CjxjZW50ZXI+PGk+Y3VycmVudGx5IHVuZGVyIGNvbnN0cnVjdGlvbiE8L2k+PC9jZW50ZXI+CjxwPlRoZSBwdXJwb3NlIG9mIHRoaXMgdG9vbCBpcyB0byBidWlsZCBzb21lIGxvZ2ljIGNpcmN1aXRzIGFuZCBoYXZlIGZ1biB3aXRoIHRoZW0uIEZvciBub3csIG9ubHkgdGhlIGJhc2ljIHN0dWZmIGxpa2UgbG9naWMgZ2F0ZXMgYXJlIGF2YWlsYWJsZS4gWW91IHBpY2sgdGhlIGRldmljZSBmcm9tIHRoZSA8Yj5EZXZpY2VzPC9iPiBmb2xkZXIgaW4gdGhlIHByb2plY3QgdHJlZSwgYW5kIHBsYWNlIHRoZW0gb250byB0aGUgc2ltdWxhdG9yIGdyaWQuIENvbm5lY3QgdGhlIGlucHV0cyBhbmQgb3V0cHV0cyB0b2dldGhlciB0byBmb3JtIGNpcmN1aXRzLCBhbmQgdXNlIHNvdXJjZXMgYW5kIGxpZ2h0cyBhcyBpbnB1dCBhbmQgb3V0cHV0IGRldmljZXMhPC9wPgo8aDI+Q29tbWFuZCBsaXN0IChwcmVzcyBrZXlzKTwvaDI+Cjx1bD4KPGxpPjxiPlc8L2I+OiByb3V0ZSB3aXJlPC9saT4KPGxpPjxiPkg8L2I+IC0gaGlnaGxpZ2h0PC9saT4KPGxpPkhvdmVyICsgPGI+RGVsPC9iPiwgPGI+QmFja3NwYWNlPC9iPjogZGVsZXRlPC9saT4KPGxpPjxiPlM8L2I+OiBwdXQgc291cmNlIChiYXNpYyBzaWduYWwgZ2VuZXJhdG9yKTwvbGk+CjxsaT48Yj5MPC9iPjogcHV0IGxpZ2h0IChiYXNpYyBzaWduYWwgaW5kaWNhdG9yKTwvbGk+CjwvdWw+"
		};

	}

	onload() {
		this.activeCircuitIndex = 0;
		this.circuitAdd();
		this.circuitLoad(this.circuits.firstChild.name, document.getElementById("explorerCircuits").lastChild.firstChild);
		this.activateWindow("simViewport");
	}

	export(pretty=false) {

		var json = {
			"circuits": []
		}

		for (var cir of this.circuits.children)
			json.circuits.push(cir.export());

		var indent = pretty? 0 : 4;
		return JSON.stringify(json, null, indent);
		
	}

	circuitAdd() {
		this.circuits.addChild( new Circuit(this.circuits._getIndex()) );
		Explorer.circuitAdd(this.circuits.lastChild.name);
	}

	circuitRemove(name) {
		this.circuits.children[name].remove();
	}

	circuitLoad(name, callerElement) {
		this.circuitActiveSet(name);
		this.circuitMakeVisible(name);
		this.itemHighlight(callerElement);
		this.activateWindow("simViewport");
	}

	circuitActiveGet() {
		return this.circuits.children[this.activeCircuitIndex];
	}

	circuitActiveSet(name) {
		this.activeCircuitIndex = this.circuits.children[name].index;
	}

	circuitMakeVisible(name) {
		for (var c of this.circuits.children)
			c.name == name? c.visible = true : c.visible = false;
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
		if (editable && editable.data.isActuator) // if we clicked a button of some kind on some device
			editable.data.device.act(editable);
	}
	_actionStart(point) {

		if (this.circuitActiveGet().netHighlighted)
			this.circuitActiveGet().netHighlighted.unhighlight();

		switch (this.tool) { // first figure out if this is some core action
			case "wire":
				this._setStatus("wiring");
				return this.editedElement = new Wire(point, this.circuitActiveGet());

			case "pointer":
				return this._pointerClicked(point);

			case "highlight":
				var editable = point.findEditable();
				if (!editable)
					return;
				editable.getNet().highlight();
				return this.circuitActiveGet().netHighlighted = editable.getNet();
		}

		// if not - check if this is a device that exists
		var deviceGroup = Devices[this.tool.split(".")[0]];
		if (!deviceGroup)
			return;

		var deviceClass = deviceGroup[this.tool.split(".")[1]];
		if (!deviceClass)
			return;

		this._setStatus("adding device");
		return this.editedElement = new deviceClass(this.circuitActiveGet(), point);
	}

	_actionFinish(point) {
		switch (this.status) {
			case "wiring":
				this.editedElement.finish(point); // finalise wire to how it must be
				if (Key.isDown('shift'))
					return this.editedElement = new Wire(point, this.circuitActiveGet());
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
				item.fillColor = item.getNet().color;
			case "wire":
				item.strokeColor = item.getNet().color;
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
		if (this.activeWindow != "simViewport")
			return;
		this.reset();
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

	reset() {
		for (var d of this.circuitActiveGet().children["devices"].children) {
			d.reset();
		}
		
		for (var n of this.circuitActiveGet().children["nets"].children) {
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

	activateWindow(id) {
		if (!document.getElementById(id))
			return;
		for (var el of document.getElementsByClassName("mainWindow"))
			el.classList.add("invisible");
		document.getElementById(id).classList.remove("invisible");
		this.activeWindow = id;
	}

	noteShow(name, callerElement) {
		document.getElementById("noteText").innerHTML = atob(this.notes[name]);
		this.activateWindow("noteArea");
		this.itemHighlight(callerElement);
	}

	noteAdd() {

	}

	noteDelete(name) {

	}

	itemHighlight(itemElement) {
		var previousCaller = document.getElementsByClassName("loadedItem")[0];
		if (previousCaller)
			previousCaller.classList.remove("loadedItem");
		itemElement.classList.add("loadedItem");
	}

}
