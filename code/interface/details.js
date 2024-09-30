var Details = {

	target: document.getElementById("details"),

	inputIdPrefix: "deviceOption",

	show: function(object) {
		
		switch (object.data.type)
		{
			case "body":
				return Details.device.show(object.parent);
			case "bodyPart":
				return Details.device.show(object.parent.parent);
			case "pin":
				return Details.pin.show(object);
		}
		
	},


	device: {
		
		show: function(device) {
			Details.guiGenerator.heading(`${device.name}`);
			Details.guiGenerator.hr();
			if (Object.keys(device.options).length != 0)
			{
				for (var optName in device.options)
					Details.guiGenerator.option(optName, device.options[optName]);
				Details.guiGenerator.button("apply", "Details.device.save()");
				Details.guiGenerator.hr();
			}
			for (var action of Devices.defaultActions)
			{
				var onclick = `window.sim.circuit.devices["${device.name}"].${action.method}()`;
				Details.guiGenerator.button(action.name, onclick, true);
			}
		},

		writeOption: function(device, input) {
		var value = input.value;
		switch (input.getAttribute("type"))
			{
				case "number":
					value = parseInt(value);
					break;
				case "select":
				case "text":
					break;

				case "button":
					return;
			}
		var oname = input.id.replace(Details.inputIdPrefix, "");
		device.options[oname].value = value;
		},

		save: function(device) {
			var dname = document.getElementById("detailsTitle").innerHTML;
			var d = window.sim.circuitActive.children.devices.children[dname];
			for (var el of document.getElementById("details").getElementsByTagName("*"))
			{
				if (el.id == "")
					continue;
				if (el.id.indexOf(Details.inputIdPrefix) != -1)
					Details.device.writeOption(d, el);
			}
			d.reload();
		}

	},

	pin: {

		show: function(pin, letEdit = true) {
			if (HierarchyManager.windowActive == "icDesigner")
				return Details.pin.showInDesigner(pin);
			return Details.pin.showInSim(pin);
		},

		showInSim: function(pin) {
			Details.guiGenerator.heading(`${pin.name} @ ${pin.device.name}`);
			Details.guiGenerator.hr();
			Details.guiGenerator.heading(` ${pin.net? pin.net.name : "none"}`);
		},

		showInDesigner: function() {
			Details.guiGenerator.heading(`${pin.name} @ ${pin.device.name}`);
			Details.guiGenerator.hr();
			Details.guiGenerator.text(`<b>On net:</b> ${pin.net? pin.net.name : "none"}`);
			Details.guiGenerator.hr();
			Details.guiGenerator.button("save", "Details.pin.save()");
		},

		save: function() {

		},

	},

	ic: {
		show: function(circuit) {
			Details.guiGenerator.heading(`Integrating "${circuit.name}"`);
			Details.guiGenerator.hr();
			Details.guiGenerator.heading("Body dimensions");
			Details.guiGenerator.option("Width", {type: "int", value: circuit.integrationDetails.body.dimensions.width});
			Details.guiGenerator.option("Height", {type: "int", value: circuit.integrationDetails.body.dimensions.height});
			Details.guiGenerator.button("Apply", 'IcDesigner.dimensions()')
			Details.guiGenerator.hr();
			Details.guiGenerator.heading("Pins");
			for (var p of circuit.integrationDetails.pins)
			{
				Details.guiGenerator.text(`${p.name}`);
				Details.guiGenerator.button("Side", `IcDesigner.side("${p.name}")`, true);
				Details.guiGenerator.button("Offset", `IcDesigner.offset("${p.name}")`, true);
				//Details.guiGenerator.option("Side", {type: "int", value: p.side});
				//Details.guiGenerator.option("Offset", {type: "int", value: p.offset});
				//Details.guiGenerator.hr();
			}

		}
	},

	guiGenerator: {

		heading: function(text) {
			var h3 = document.createElement("h3");
			h3.innerHTML = text;
			h3.classList.add("detailsTitle");
			Details.target.appendChild(h3);
		},

		text: function(text) {
			var p = document.createElement("p");
			p.innerHTML = text;
			Details.target.appendChild(p);
		},

		button: function(text, action, half=false) {
			var apply = document.createElement("input");
			apply.setAttribute("type", "button");
			if (half)
				apply.classList.add("half");
			apply.value = text;
			Details.setInputAvailability(apply);
			apply.setAttribute("onclick", action);
			Details.target.appendChild(apply);
		},

		hr: function() {
			Details.target.appendChild(document.createElement("hr"));
		},

		option: function(optName, optData) {
			var l = document.createElement("label");
			l.setAttribute("for", `${Details.inputIdPrefix}${optName}`);

			l.innerHTML = optData.description? optData.description : optName;
			Details.target.appendChild(l);

			var o = Details.guiGenerator._opt[optData.type](optName, optData);
			o.id = `${Details.inputIdPrefix}${optName}`;
			o.name = `${Details.inputIdPrefix}${optName}`;
			Details.setInputAvailability(o);
			Details.target.appendChild(o);
		},

		_opt: {

			qty: function(name, data) {
				var i = document.createElement("input");
				i.setAttribute("type", "number");
				i.setAttribute("min", "1");
				i.setAttribute("max", "999");
				i.value = data.value;
				return i;
			},

			choice: function(name, data) {
				var sel = document.createElement("select");
				sel.setAttribute("type", "select");
				for (var c of data.choices)
				{
					var o = document.createElement("option");
					var val = c;
					var text = c;
					if (c.constructor.name == "Array")
						[val, text] = c;
					
					o.innerHTML = text;
					o.setAttribute("value", val);
					sel.appendChild(o);
					if (c == data.value)
						o.setAttribute("selected", "selected");
				}
				return sel;
			},

			string: function(name, data) {
				var i = document.createElement("input");
				i.setAttribute("type", "text");
				i.setAttribute("min", "2");
				i.setAttribute("max", "24");
				i.value = data.value;
				return i;
			},

			int: function(name, data) {
				var i = document.createElement("input");
				i.setAttribute("type", "number");
				i.setAttribute("min", data.min);
				i.setAttribute("max", data.max);
				i.value = data.value;
				return i;
			}
		}
	},

	
	
	readOnly: false,

	setReadOnly: function(state) {
		if (typeof(state) != "boolean")
			return;
		Details.readOnly = state;
		for (var i of document.getElementById("details").getElementsByTagName("input"))
			Details.setInputAvailability(i);
	},

	setInputAvailability: function(elem) {
		Details.readOnly? elem.setAttribute("disabled", "disabled") : elem.removeAttribute("disabled");
	}

}
