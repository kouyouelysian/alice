var IcDesigner = {

	targets: {
		//table: document.getElementById("icTable")
	},

	sourceCircuit: undefined,
	previousIntegration: undefined,

	createFrom: function(circuit) {
		IcDesigner.sourceCircuit = circuit;
		IcDesigner.previousIntegration = circuit.integrationDetails;
		circuit.integrationInit();	

		/*var ICPins = circuit.getDevicesByClass("Primitives.ICPin");
		for (var icp of ICPins)
			IcDesigner.targets.table.appendChild(IcDesigner.createTableRow(icp));*/

	},

	isEligible: function(circuit) {
		var ICPins = circuit.getDevicesByClass("Primitives.ICPin");
		if (ICPins.length == 0)
		{
			window.sim.throwError("not a single IC pin found!");
			return false;
		}
		return true;

	},

	findPin: function(pinName){
		for (var p of IcDesigner.sourceCircuit.integrationDetails.pins)
		{
			if (p.name == pinName)
				return p;
		}
		return false;
	},

	side: function(pinName) {

		var pin = IcDesigner.findPin(pinName);

		pin.side += 1;

		if (pin.side == 4)
			pin.side = 0;

		IcDesigner.limit(pin);

		window.sim.editedElement.recreatePackage();
	},

	offset: function(pinName) {

		var pin = IcDesigner.findPin(pinName);
		pin.offset += 1;
		IcDesigner.limit(pin);


		window.sim.editedElement.recreatePackage();
	},

	limit: function(pin) {

		var comp = pin.side%2==0?
			IcDesigner.sourceCircuit.integrationDetails.body.dimensions.height :
			IcDesigner.sourceCircuit.integrationDetails.body.dimensions.width;
		comp -= 1;

		if (pin.offset >= comp)
			pin.offset = 0;
	},

	dimensions: function() {
		var w = document.getElementById("deviceOptionWidth").value;
		var h = document.getElementById("deviceOptionHeight").value;
		IcDesigner.sourceCircuit.integrationDetails.body.dimensions.width = w;
		IcDesigner.sourceCircuit.integrationDetails.body.dimensions.height = h;
		window.sim.editedElement.recreatePackage();
	},

	/*
	createTableRow(ICPin) {
		var tr = document.createElement("tr");
		IcDesigner.createTableCell(tr, ICPin.name);
		IcDesigner.createTableCell(tr, ICPin.options.label.value);
		var side = IcDesigner.createTableCell(tr, "");
		IcDesigner.createSelect(side, [["left",0],["top",1],["right",2],["bottom",3]]);
		return tr;
	},

	createTableCell(parentRow, cellContents, bareText = true)
	{
		var td = document.createElement("td");
		bareText? td.innerHTML = cellContents : td.appendChild(cellContents);
		parentRow.appendChild(td);
		return td;
	},

	createSelect(parentCell, options=[/*["name", "value"], ...*//*])
	{
		var sel = document.createElement("select");
		for (var o of options)
		{
			var opt = document.createElement("option");
			opt.innerHTML = o[0];
			opt.value = o[1];
			sel.appendChild(opt);
		}
		parentCell.appendChild(sel);
	},
	*/

	editPin: function(name) {
		alert(name);
	},

	save: function() {

	},

	reset: function() {
		IcDesigner.sourceCircuit = undefined;
		IcDesigner.previousIntegration = undefined;
	}

}