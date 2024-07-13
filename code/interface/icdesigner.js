var IcDesigner = {

	targets: {
		table: document.getElementById("icTable")
	},

	createFrom: function(circuit) {
		var inOutPins = circuit.getDevicesByClass("Primitives.InOutPin");
		if (inOutPins.length == 0)
			return alert("no in/out labels!");
		for (var iop of inOutPins)
			IcDesigner.targets.table.appendChild(IcDesigner.createTableRow(iop));

	},

	createTableRow(inOutPin) {

		var tr = document.createElement("tr");

		var tdLabel = document.createElement("td");
		var tdName = document.createElement("td");
		var tdDirection = document.createElement("td");
		var tdSelect = document.createElement("td");
		tdLabel.innerHTML = inOutPin.options.label.value;
		tdName.innerHTML = inOutPin.name;
		tdDirection.innerHTML = inOutPin.options.direction.value;
		tdSelect.innerHTML = `<input type='button' value='manage' onclick='IcDesigner.editPin("${inOutPin.name}")'>`;
		tr.appendChild(tdLabel);
		tr.appendChild(tdName);
		tr.appendChild(tdDirection);
		tr.appendChild(tdSelect);

		return tr;
	},

	editPin: function(name) {
		alert(name);
	}

}