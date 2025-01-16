Devices.Educational = {};

Devices.Educational.TruthTable = class TruthTable extends Devices.Device {
	

	static packageData = {
			"pins": [],
			"body": {
				"origin": {
					x:0,
					y:0
				},
				"dimensions": {
					"width": 2,
					"height": 2
				},
				"symbol": null,
				"label": null
			}	
		};

	constructor(circuit, point) {

		var opts = {
			arguments: {type:"qty", value:2, min:1, max:6},
			results: {type:"qty", value:1}
			
		};	
		super(circuit, point, opts);
		this.createDecorations();
		this.activeRow = null;
	}

	get packageData() {
		var pd = bmco.clone(Devices.Educational.TruthTable.packageData);
		pd.body.dimensions.width =  2 + this.options.arguments.value + this.options.results.value;
		pd.body.dimensions.height = 2 + this.rowsTotal;
		pd.body.origin.x = Math.floor(pd.body.dimensions.width/2);
		pd.body.origin.y = Math.floor(pd.body.dimensions.height/2);

		for (var x = 0; x < this.options.arguments.value; x++) 
			pd.pins.push({
				"name":`arg${x}`,
				"mode":"out",
				"side":1,
				"offset":1+x
			});
		for (var x = 0; x < this.options.results.value; x++) 
			pd.pins.push({
				"name":`res${x}`,
				"mode":"in",
				"side":1,
				"offset":1+this.options.arguments.value+x
			});

		return pd;
	}

	get rowsTotal() {
		return Math.pow(2, this.options.arguments.value);
	}

	createRunButton() {

		var point = new Point(this.position.x + window.sim.grid, this.position.y + window.sim.grid);
		var button = new Path.Circle(point, window.sim.grid * 0.35);
	
		button.fillColor = window.sim.appearance.color.false;
		button.data.type = "actuator";
		button.data.device = this;
		button.name = `run`;
		this.children.actuators.addChild(button);
	}

	createRowIndicators() {
		for (var x = 0; x < this.rowsTotal; x++)
		{
			var point = new Point(this.position.x + window.sim.grid, this.position.y + window.sim.grid * (2 + x));
			var light = new Path.Circle(point, window.sim.grid * 0.25);
			this.children.decorations.addChild(light);
			light.fillColor = window.sim.appearance.color.udnefined;
			light.data.type = "bodyPart";
			light.data.device = this;
			light.name = `light${x}`;
			
		}
	}

	createText(content, name, x=0, y=0) {
		var text = new PointText(new Point(this.position.x + (2+x)*window.sim.grid, this.position.y + (1.1+y)*window.sim.grid));
		this.children.decorations.addChild(text);
		text.fontWeight = window.sim.grid * 0.5;
		text.justification = 'center';
		text.content = content;
		text.leading = 0;
		text.name = name;
		text.data.type = "bodyPart";
		
	}

	createHeader() {
		var namesArgs = ["A", "B", "C", "D", "E", "F"];
		for (var x = 0; x < this.options.arguments.value; x++)
			this.createText(namesArgs[x], `argHeader${x}`, x, 0);
		for (var y = 0; y < this.options.results.value; y++)
			this.createText(`Q${this.options.results.value==1?"":y}`, `resHeader${y}`, this.options.arguments.value+y);
	}

	lookupRowArgMarker(row, arg) {
		var div = (this.options.arguments.value-arg);//1 + (this.options.arguments.value-arg);
		return Math.floor(row/div) % 2 == 0? 0 : 1; // Math.ceil(row/div)%2==0? "0" : "1";
	}

	createRows() {
		for (var row = 0; row < this.rowsTotal; row++)
		{
			for (var arg = 0; arg < this.options.arguments.value; arg++)
				this.createText(this.lookupRowArgMarker(row, arg), `arg${arg}-row${row}`, arg, 1+row);
			for (var res = 0; res < this.options.results.value; res++)
				this.createText("?", `res${res}-row${row}`, this.options.arguments.value+res, 1+row);
		}
	}

	createDecorations() {
		this.children.decorations.removeChildren();
		this.createHeader();
		this.createRows();
		this.createRunButton();
		this.createRowIndicators();

	}

	reload() {
		super.reload();
		this.createDecorations();

	}

	resultWrite(result, resn, row) {

		var content = "?";
		if (result === true)
			content = "1";
		else if (result === false)
			content = "0";

		this.decorations[`res${resn}-row${row}`].content = content;
	}

	act(actuator) {
		if (actuator.name !== "run")
			return;
		if (window.sim.status != "running")
			return sim.throwError("Please, run the circuit before using the truth table!");

		for (var x = 0; x < this.rowsTotal; x++) // decolor all lights
			this.decorations[`light${x}`].fillColor = window.sim.appearance.color.undefined;

		this.activeRow += this.activeRow===null? 0 : 1;
		if (this.activeRow == this.rowsTotal)
			this.activeRow = null;

		if (this.activeRow !== null) 
			this.decorations[`light${this.activeRow}`].fillColor = window.sim.appearance.color.true;
		
		for (var x = 0; x < this.options.arguments.value; x++) // write to pins from the selected row
		{
			if (this.activeRow === null)
				this.write(`arg${x}`, undefined);
			else
				this.write(`arg${x}`, this.decorations[`arg${x}-row${this.activeRow}`].content=="1"? true : false);
		}

	}

	update() {
		if (this.activeRow === null)
			return;
		for (var x = 0; x < this.options.results.value; x++)
			this.resultWrite(this.read(`res${x}`), x, this.activeRow);
	}

	reset() {
		super.reset()
		for (var x = 0; x < this.options.results.value; x++)
		{
			for (var y = 0; y < this.rowsTotal; y++)
				this.resultWrite(undefined, x, y);
		}

	}
}