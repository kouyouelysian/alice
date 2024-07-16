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
			Details.target.innerHTML = `<h3 id="detailsTitle">${device.name}</h3>`;
			Details.guiGenerator.hr();
			for (var optName in device.options)
				Details.guiGenerator.option(optName, device.options[optName]);
			Details.guiGenerator.hr();
			Details.guiGenerator.apply("Details.device.save()");
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
			Details.target.innerHTML = `<h3 id="detailsTitle">${pin.name} @ ${pin.device.name}</h3>`;
			Details.guiGenerator.hr();
			Details.target.innerHTML += `<p><b>On net:</b> ${pin.net? pin.net.name : "none"}</p>`;
		},

		showInDesigner: function() {
			Details.target.innerHTML = `<h3 id="detailsTitle">${pin.name} @ ${pin.device.name}</h3>`;
			Details.guiGenerator.hr();
			Details.target.innerHTML += `<p><b>On net:</b> ${pin.net? pin.net.name : "none"}</p>`;
			Details.guiGenerator.hr();
			Details.guiGenerator.apply("Details.pin.save()");
		},

		save: function() {

		},

	},

	guiGenerator: {

		apply: function(action) {
			var apply = document.createElement("input");
			apply.setAttribute("type", "button");
			apply.value = "apply";
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
			l.innerHTML = optName;
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
					o.setAttribute("value", c);
					o.innerHTML = c;
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
