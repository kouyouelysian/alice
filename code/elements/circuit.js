class Circuit {

	constructor() {
		// paper.js stuff init
		this.editables = project.addLayer(new Layer({ name:"editables" }));
		project.addLayer(new Layer({ name:"above" }));
		project.layers.editables.activate();
		this.nets = new IndexedGroup();
		this.devices = new IndexedGroup();
		view.draw();

		// style definitions
		project.layers.editables.data.style = VisualSchemes.default;

		// logic 
		this.status = "idle";
		this.tool = "pointer";

		this.selection = null;
		this.netDragged = null;
		this.netHighlighted = null;
		this.pickedDevice = null;

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

	_getIndex(group, stack) {
		if (stack.length == 0)
			return group.children.length;
		return stack.pop();
	}

	_freeIndex(id, stack) {
		stack.push(parseInt(id.substr(3)));
	}

	_setupCursor() {
		project.layers.above.activate();
		var gc = new Path.Circle(new Point(GLOBAL_sizing/2, GLOBAL_sizing/2), project.layers.editables.data.style.size.cursor.radius);
		gc.strokeColor = project.layers.editables.data.style.color.selected;
		gc.strokeWidth = project.layers.editables.data.style.size.cursor.width;
		gc.name = 'gridCursor';		
		project.layers.editables.activate();;
		return gc;
	}

	netStart(startPoint) {
		const netElement = startPoint.findEditable();
		if (netElement != null && (netElement.data.type == "junction" || netElement.data.type == "wire"))
			this.netDragged = netElement.parent.parent; // junction->junctions->net			
		else
			this.netDragged = new Net(this.nets);
		var wire = new Wire(startPoint, this.netDragged);
		this.netDragged.data.wireDraggedIndex = wire.index;	
	}

	netPoint(draggedWirePoint, netFinish=false) {
		
		var wire = this.netDragged.children["wires"].children[this.netDragged.data.wireDraggedIndex];
		wire.lastSegment.remove(); // temporarily shrink wire to starting point
		const otherNetElement = draggedWirePoint.findEditable({exclude: wire});
		if (otherNetElement && (otherNetElement.data.type == "wire" || otherNetElement.data.type == "junction"))
			this.netDragged.mergeWith(otherNetElement.parent.parent);
		wire.finish(draggedWirePoint); // finalise wire to how it must be

		if (!netFinish)
		{
			var newWire = new Wire(draggedWirePoint, this.netDragged);
			return this.netDragged.data.wireDraggedIndex = newWire.index;
		}

		this.netDragged.data.wireDraggedIndex = null;
		this.netDragged = null;
		this.status = "idle";
	}

	netFinish(finishPoint) {
		return this.netPoint(finishPoint, true);
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
				item.fillColor = item.net.color;
			case "wire":
				item.strokeColor = item.net.color;
				return;
			case "pin":
				return item.strokeColor = project.layers.editables.data.style.color.devices;
			case "body":
				return item.setStrokeColor(item.layer.data.style.color.devices);
		}
	}

	_selectionNetHighlight() {
		this._selectionNetUnhighlight();
		if (this.selection == null)
			return;
		this.netHighlighted = this.selection.parent.parent
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
		if (this.status == "net") {

			this.netDragged.children["wires"].lastChild.remove();
			this.netDragged = null;
		}
		else if (this.status == "device") {
			this.circuit.deviceRemove(this._nameToId(this.pickedDevice.name));
			this.pickedDevice.remove();
		}
		this.status = "idle";
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
		if (this.status == "net" && hit.item == this.netDragged.children["wires"].children[this.netDragged.data.wireDraggedIndex])
			return;
		// prevent highlighting the device we picked
		else if (this.status == "device" && hit.item == this.pickedDevice.children.body)
			return;

		if (hit.item != this.selection)
		{
			this._makeNotSelected(this.selection);
			this.selection = this._makeSelected(hit.item);
		}

	}

	_pointerClick(point) {
		var actuator = point.findEditable({type:"actuator"});
		if (actuator) // if we clicked a button of some kind on some device
			actuator.data.device.act(actuator);
	}

	_devicePick(point) {
		this.pickedDevice = new Devices[this.tool](this.devices, point);
	}


	_devicePlace(point) {
		this.status = "idle";
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
		for (var net of this.nets.children) {
			net.update();
		}
		for (var dev of this.devices.children) {
			dev.update();
		}
	}

}
