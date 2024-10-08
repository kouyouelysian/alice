class IndexedGroup extends Group {
	constructor() {
		super()
		this.indexStack = [];
	}

	getIndex() {
		if (this.indexStack.length == 0)
			return this.children.length;
		return this.indexStack.pop();
	}

	freeIndex(id, stack) {
		var n = parseInt(id.substr(3));
		this.indexStack.push(n);
	}

	clear() {
		this.children = [];
		this.indexStack = [];
	}
}