class IndexedGroup extends Group {
	constructor() {
		super()
		this.indexStack = [];
	}

	_getIndex() {
		if (this.indexStack.length == 0)
			return this.children.length;
		return this.indexStack.pop();
	}

	_freeIndex(id, stack) {
		this.indexStack.push(parseInt(id.substr(3)));
	}
}