class Net extends Group {

	constructor(parentGroup) {
		
		super();
	
		this.name = "net"+parentGroup._getIndex();
		this.data.type = "net";
		parentGroup.addChild(this);

		this.color = this.layer.data.style.color.undefined;
		this.width = this.layer.data.style.size.wire;	

		this.state = undefined;

		const wires = new Group();
		wires.name = "wires";
		this.addChild(wires);

		const junctions = new Group();
		junctions.name = "junctions";
		this.addChild(junctions);

		this.connections = [];

		this.data.draggedWire = null;

	}

	remove() {
		this.parent._freeIndex(this.name);
		super.remove();
	}

	update() {

		for (const pin of this.connections) { // first find out this net's state
			if (pin.mode == "out")
			{
				if (this.state == pin.state)
					continue;
				this.state = pin.state;
				this.colorByState(this.state);
			}
		}
		for (const pin of this.connections) { // then distribute it to all input pins
			if (pin.mode == "in")
				pin.set(this.state);
		}
		return true;
	}

	mergeWith(otherNet) {
		if (this.name == otherNet.name)
			return false;
		this.children["wires"].children = this.children["wires"].children.concat(otherNet.children["wires"].children);
		this.children["junctions"].children = this.children["junctions"].children.concat(otherNet.children["junctions"].children);
		return otherNet.remove();
	}

	recolor(color) {
		this.color = color;
		this.strokeColor = color;
		this.fillColor = color;
	}

	addConnection(pin) {
		this.connections.push(pin);
	} 

	colorByState(state) {
		if (state === true)
			this.recolor(this.layer.data.style.color.true);
		else if (state === false)
			this.recolor(this.layer.data.style.color.false);
		else
			this.recolor(this.layer.data.style.color.undefined);
	}

	highlight() {
		this.recolor(this.layer.data.style.color.highlighted);
	}

	unhighlight() {
		this.recolor(this.layer.data.style.color.undefined);
	}
}
