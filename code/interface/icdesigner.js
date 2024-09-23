var IcDesigner = {

	targets: {
		//table: document.getElementById("icTable")
	},

	createFrom: function(circuit) {
		
		/*var ICPins = circuit.getDevicesByClass("Primitives.ICPin");
		for (var icp of ICPins)
			IcDesigner.targets.table.appendChild(IcDesigner.createTableRow(icp));*/

	},

	isEligible(circuit) {
		var ICPins = circuit.getDevicesByClass("Primitives.ICPin");
		if (ICPins.length == 0)
		{
			window.sim.throwError("not a single IC pin found!");
			return false;
		}
		return true;

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
	}

}