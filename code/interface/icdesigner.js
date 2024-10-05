var IcDesigner = {

	targets: {
		table: document.getElementById("icTable")
	},

	createFrom: function(circuit) {
	
		for (var iop of inOutPins)
			IcDesigner.targets.table.appendChild(IcDesigner.createTableRow(iop));

	},

	isEligible(circuit) {
		var inOutPins = circuit.getDevicesByClass("Primitives.InOutPin");
		if (inOutPins.length == 0)
			window.sim.throwError("not a single in/out label found!");
			return false;

	},

	createTableRow(inOutPin) {
		var tr = document.createElement("tr");
		IcDesigner.createTableCell(tr, inOutPin.name);
		IcDesigner.createTableCell(tr, inOutPin.options.label.value);
		IcDesigner.createTableCell(tr, inOutPin.options.direction.value);
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

	createSelect(parentCell, options=[/*["name", "value"], ...*/])
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

	editPin: function(name) {
		alert(name);
	}

}