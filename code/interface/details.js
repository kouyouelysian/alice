var Details = {

	target: document.getElementById("details"),

	inputIdPrefix: "deviceOption",

	show: function(object) {
		if (object.data.type == "body")
			return Details.showDevice(object.parent);
		Details.target.innerHTML = object.name; 
	},

	showDevice: function(device) {
		Details.target.innerHTML = `<h3 id="detailsTitle">${device.name}</h3>`;
		Details.showHr();
		for (var optName in device.options)
			Details.showOption(optName, device.options[optName]);
		var apply = document.createElement("input");
		apply.setAttribute("type", "button");
		apply.value = "apply";
		Details.setInputAvailability(apply);
		apply.setAttribute("onclick", "Details.saveDevice()");
		Details.showHr();
		Details.target.appendChild(apply);
	},

	showOption: function(optName, optData) {
		
		var l = document.createElement("label");
		l.setAttribute("for", `${Details.inputIdPrefix}${optName}`);
		l.innerHTML = optName;
		Details.target.appendChild(l);

		var o = Details.makeOpt[optData.type](optName, optData);
		o.id = `${Details.inputIdPrefix}${optName}`;
		o.name = `${Details.inputIdPrefix}${optName}`;
		Details.setInputAvailability(o);
		Details.target.appendChild(o);

	},

	makeOpt: {

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
	},

	saveDevice: function() {
		var dname = document.getElementById("detailsTitle").innerHTML;
		var d = window.sim.circuitActiveGet().children.devices.children[dname];
		for (var el of document.getElementById("details").getElementsByTagName("*"))
		{
			if (el.id == "")
				continue;
			if (el.id.indexOf(Details.inputIdPrefix) != -1)
				Details.saveOption(d, el);
		}
		d.reload();
	},

	saveOption: function(device, input) {
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
		console.log(device, input, oname);
		device.options[oname].value = value;
	},

	showHr: function() {
		Details.target.appendChild(document.createElement("hr"));
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