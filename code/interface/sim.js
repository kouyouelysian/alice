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
		this.notes = {};

	}


	_downloadTextFile(text, name="project", extension="alice") {
		var filename = `${name}.${extension}`;
		var file = new Blob([text], {type: "text/plain"});
		if (window.navigator.msSaveOrOpenBlob)
	        window.navigator.msSaveOrOpenBlob(file, filename);
	    else { 
			var url = URL.createObjectURL(file);
	        var a = document.createElement("a");
	        a.href = url;
	        a.download = filename;
	        document.body.appendChild(a);
	        a.click();
	        setTimeout(function() {
	            document.body.removeChild(a);
	            window.URL.revokeObjectURL(url);  
	        }, 100); 
	    }
	}

	_selectTextFile(callback, extensions=null) {
		var finput = document.createElement("input");
		finput.id = "finput";
		finput.setAttribute("type", "file");
		finput.setAttribute("callback", callback);
		finput.setAttribute("onchange", "window.sim._getTextFileContents()");
		document.body.appendChild(finput);
		finput.click();
	}

	_getTextFileContents() {
		var finput = document.getElementById("finput");
		var file = finput.files[0];
		var reader = new FileReader();
		reader.addEventListener('load', (event) => {
			window.sim._parseTextFile(event.target.result);
		});
		reader.readAsText(file);
	}

	_parseTextFile(text) {
		var callbackFnName = document.getElementById("finput").getAttribute("callback");
		var callbackFn = this[callbackFnName];
		callbackFn(text);
		document.getElementById("finput").remove();
	}


	export() {
		var json = {
			"circuits": [],
			"notes": []
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

	import(text) {
		var json = JSON.parse(text);
		console.log(json);
	}


	projectLoad() {
		this._selectTextFile("import");
	}

	projectFileUpload() {
		var finput = document.getElementById("finput");
		var file = finput.files[0];
		var reader = new FileReader();
		reader.addEventListener('load', (event) => {
			var json = JSON.parse(event.target.result);
		});
		reader.readAsText(file);
	}


	projectSave(pretty=false) {
		var json = this.export();
		var indent = pretty? 0 : 4;
		var text = JSON.stringify(json, null, indent);
		this._downloadTextFile(text);
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
		this.circuitActiveSet(name);
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

	circuitLoad(name, callerElement) {
		
	}

	circuitExport(alert=false) {
		var name = ContextMenu.caller.innerHTML;
		var circuit = this.circuits.children[name];
		if (!circuit)
			return;
		var json = circuit.export();
		if (alert)
			window.alert(json);
		return json;
	}

	circuitSave(pretty=false) {
		var json = circuitExport();
		var indent = pretty? 0 : 4;
		var text = JSON.stringify(json, null, indent);
		this._downloadTextFile(text, json.name, "circuit");
	}

	circuitImport(text) {
		consolel.log("circuit", text);
	}

	noteRemove(name) {

	}

	noteRename() {
		return this._itemRename("note");
	}

	noteJSON(name, text) {
		return {"name":name, "text":text};
	}

	noteEdit() {
		this.activateWindow("noteEditor");
		var name = document.getElementsByClassName("loadedItem")[0].getElementsByTagName("a")[0].innerHTML;
		var text = atob(this.notes[name]);
		if (text.indexOf("<pre>") == 0)
			text = text.replace("<pre>", "");
		if (text.lastIndexOf("</pre>") == text.length - 6)
			text = text.substring(0, text.length - 6);
		document.getElementById("noteEditor").getElementsByTagName("textarea")[0].value = text;
	}

	noteSave(type="html") {
		var text = document.getElementById("noteEditor").getElementsByTagName("textarea")[0].value; 
		if (type == "plaintext")
		{
			if (text.indexOf("<pre>") == -1 )
				text = `<pre>${text}`;
			if (text.indexOf("</pre>") == -1 )
				text = `${text}</pre>`;
		}
		var text64 = btoa(text);
		var name = document.getElementsByClassName("loadedItem")[0].getElementsByTagName("a")[0].innerHTML;
		this.notes[name] = text64;
		this.noteLoad(name);
		this.activateWindow("noteArea");
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

	onload() {
		this.activeCircuitIndex = 0;
		this.setupTool();
		document.getElementById('simCanvas').scrollIntoView({
			block: 'center',
			inline: 'center',
			behavior: 'auto'
		}); 
	}

}
