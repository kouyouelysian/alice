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
		this.indexStack.push(parseInt(id.substr(3)));
	}

	clear() {
		this.children = [];
		this.indexStack = [];
	}
}