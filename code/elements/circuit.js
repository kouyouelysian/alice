class Circuit extends Group {

	constructor() {

		super();
		this.name = "circuit";


		// paper.js stuff init
		this.editables = project.addLayer(new Layer({ name:"editables" }));
		var above = project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		view.draw()

		this.editables.addChild(this);
		// main subgroups

		var nets = new IndexedGroup();
		nets.name = "nets";
		this.addChild(nets);

		var devices = new IndexedGroup();
		devices.name = "devices";
		this.addChild(devices);
		
		// style definitions
		project.layers.editables.data.style = VisualSchemes.default;

		this.appearance = VisualSchemes.default;

		// logic 
		this.status = "idle";
		this.tool = "pointer";
		this.selection = null;
		this.wireDragged = null;
		this.netHighlighted = null;
		this.devicePicked = null;

		// other stuff
		this.gridCursor = this._setupCursor();

		// running
		this.updateTimer = null;
		this.updatePeriod = 25; // ms

	}

	run() {
		this.updateTimer = window.setInterval(function(){window.circuit.update()}, window.circuit.updatePeriod)
	}

	stop() {
		clearTimeout(this.updateTimer);
	}

	_setupCursor() {
		project.layers.above.activate();
		var gc = new Path.Circle(new Point(GLOBAL_sizing/2, GLOBAL_sizing/2), project.layers.editables.data.style.size.cursor.radius);
		gc.strokeColor = project.layers.editables.data.style.color.selected;
		gc.strokeWidth = project.layers.editables.data.style.size.cursor.width;
		gc.name = 'gridCursor';		
		project.layers.editables.activate();
		return gc;
	}

	netStart(startPoint) {
		this.wireDragged = new Wire(startPoint, this);
	}

	netPoint(clickPoint, keepWiring=true) {
		this.wireDragged.finish(clickPoint); // finalise wire to how it must be
		if (keepWiring)
			return this.wireDragged = new Wire(clickPoint, this);
		this.wireDragged
		this.status = "idle";
	}

	netFinish(finishPoint) {
		return this.netPoint(finishPoint, false);
	}

	_devicePick(point) {
		this.devicePicked = new Devices[this.tool](this, point);
	}


	_devicePlace(point) {
		this.devicePicked.place();
		this.devicePicked = null;
		this.status = "idle";
	}

	_makeSelected(item) {
		switch (item.data.type)
		{
			case "junction":
			case "wire":
			case "pin":
				item.strokeColor = item.layer.data.style.color.selected;
				break;
			case "body":
				item.setStrokeColor(item.layer.data.style.color.selected);
				break;
		}
			
		return item;
		
	}

	_makeNotSelected(item) {
		
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
				return item.setStrokeColor(item.layer.data.style.color.devices);
		}
	}

	_selectionNetHighlight() {
		this._selectionNetUnhighlight();
		if (this.selection == null)
			return;
		this.netHighlighted = this.selection.getNet();
		console.log("highlit", this.selection.getNet().name);
		return this.selection.parent.parent.highlight();
	}

	_selectionNetUnhighlight() {
		if (!this.netHighlighted)
			return;
		this.netHighlighted.unhighlight();
		this.netHighlighted = null;
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

				case 'a': this.tool = "And"; return;
				case 'o': this.tool = "Or"; return;
				case 'i': this.tool = "Not"; return;
				case 'n': this.tool = "Nand"; return;
				case '1': this.tool = "Nor"; return;
				case 'x': this.tool = "Xor"; return;

				case 's': this.tool = "Source"; return;
				case 'l': this.tool = "Light"; return;
				case 'c': this.tool = "Clock"; return;

				case 'delete': this._removeEditable(); return;
			}
	}

	_removeEditable() {
		if (!this.selection)
			return;
		this.selection.remove();
		this.selection = null;
		
	}

	_actionStopAny() {
		if (this.status == "net") { // drawing a net
			if (this.tool == "wire") {
				this.wireDragged.remove();
			}
		}
		else if (this.status == "device") {
			this.devicePicked.remove();
		}
		this.status = "idle";
	}

	_pointerClick(point) {
		var actuator = point.findEditable({type:"actuator"});
		if (actuator) // if we clicked a button of some kind on some device
			actuator.data.device.act(actuator);
	}

	











	throwError(text) {
		this.stop();
		alert(text);
	}


	point(pointRaw, pointQuantized) { // called when a drawn cursor entered a new xcell, ycell position

		var hit = null;

		if (this.status == "idle")
			hit = this._hitTestDouble(this.editables, pointQuantized, pointRaw);
		else
			hit = this.editables.hitTest(pointQuantized);

		if (hit == null) {
			this._makeNotSelected(this.selection);
			this.selection = null;
			return;
		}

		// prevent highlighting the wire we're currently drawing
		if (this.status == "net" && hit.item == this.wireDragged)
			return;
		// prevent highlighting the device we picked
		else if (this.status == "device" && hit.item == this.devicePicked.children.body)
			return;

		if (hit.item != this.selection)
		{
			this._makeNotSelected(this.selection);
			this.selection = this._makeSelected(hit.item);
		}

	}

	

	click() { // called from gui clickbox onclick event

		const clickPoint = new Point(event.offsetX, event.offsetY);
		clickPoint.quantize(project.layers.editables.data.style.size.grid);

		if (this.status == "idle") {
			switch (this.tool)
			{
				case "wire":
					this.status = "net";
					this._selectionNetUnhighlight();
					return this.netStart(clickPoint);
				case "highlight":
					return this._selectionNetHighlight();

				case "pointer":
					return this._pointerClick(clickPoint);

				default: // if that's not a tool, that's probably a device being placed
					this.status = "device";
					return this._devicePick(clickPoint);
				
			}
		}
		else if (this.status == "net") 
		{
			if (Key.isDown('shift'))
				this.netPoint(clickPoint);
			else
				this.netFinish(clickPoint);
		}
		else if (this.status == "device")
			this._devicePlace(clickPoint);
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
		project.layers.editables.data.style = scheme;
		document.getElementById("simViewport").style.backgroundColor = scheme.color.fill;
	}


	update() {
		for (var net of this.children["nets"].children) {
			net.update();
		}
		for (var dev of this.children["devices"].children) {
			dev.update();
		}
	}

}
