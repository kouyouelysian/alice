var Details = {

	target: document.getElementById("details"),

	inputIdPrefix: "option",

	show: function(object) {
		
		switch (object.data.type)
		{
			case "body":
				return Details.device.show(object.parent);
			case "bodyPart":
				return Details.device.show(object.parent.parent);
			case "pin":
				return Details.pin.show(object);
			case "circuit":
				return Details.circuit.show(object);
		}
		
	},

	project: {
		show: function() {
			Details.inputIdPrefix = "projectOption";
			Details.guiGenerator.reset();
			Details.guiGenerator.heading("Project Settings");
			Details.guiGenerator.hr();
			var opts = {
				"Name": {
					type:"string",
					value:window.sim.meta.name,
					description:"Project name",
					onchange:`window.sim.meta.name  = document.getElementById("projectOptionName").value`
				},
				"FPS":  {
					type:"int",
					value:window.sim.meta.fps,
					description:"Frames per second",
					onchange:`window.sim.meta.fps  = document.getElementById("projectOptionFPS").value`
				},
				"TPF":  {
					type:"int",
					value:window.sim.meta.tpf,
					description:"Ticks per frame",
					onchange:`window.sim.meta.tpf  = document.getElementById("projectOptionTPF").value`
				}
			}
			for (var name in opts)
				Details.guiGenerator.option(name, opts[name]);
		}
	},

	circuit: {
		show: function(circuit) {
			Details.guiGenerator.reset();
			Details.guiGenerator.heading(circuit.name);
			Details.guiGenerator.hr();
			Details.guiGenerator.text(`Devices: ${circuit.devices.length}`);
			Details.guiGenerator.text(`Nets: ${circuit.nets.length}`);
			Details.guiGenerator.text(`Integration: ${circuit.integrationDetails? "present" : "absent"}`);
			if (circuit.dependencies.length > 0)
			{
				var depText = `IC dependencies: `;
				for (var d of circuit.dependencies)
					depText += `${d}, `;
				Details.guiGenerator.text(depText.slice(0, depText.length-2));
				Details.guiGenerator.hr();	
			}
			Details.guiGenerator.hr();
			Details.guiGenerator.button(`Benchmark Circuit`, `window.sim.benchmark()`);


		}
	},

	device: {
		
		show: function(device) {
			Details.inputIdPrefix = "deviceOption";
			Details.guiGenerator.reset();
			Details.guiGenerator.heading(device.name, "detailsTitle");
			Details.guiGenerator.hr();

			var opts = bmco.clone(device.options);
			for (var oname in opts)
			{	// delete all hidden options to make them uneditables
				if (opts[oname].type == "hidden")
					delete opts[oname];
			}

			if (Object.keys(opts).length != 0)
			{
				for (var optName in opts)
				{
					var options = opts[optName];
					if (!options.onchange)
						options.onchange = "Details.device.save()";
					Details.guiGenerator.option(optName, opts[optName]);
				}
				Details.guiGenerator.hr();
			}
			for (var action of Devices.defaultActions)
			{
				var onclick = `window.sim.circuit.devices["${device.name}"].${action.method}()`;
				Details.guiGenerator.button(action.name, onclick, true);
			}
			
			if (device.memo)
			{
				Details.guiGenerator.hr();
				Details.guiGenerator.pre(device.memo);
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
			Details.guiGenerator.reset();
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
			Details.inputIdPrefix = "icOption";
			Details.guiGenerator.reset();
			Details.guiGenerator.heading(`Integrating "${circuit.name}"`);
			Details.guiGenerator.hr();
			Details.guiGenerator.heading("Body dimensions");
			Details.guiGenerator.option("Width", {type: "int", value: circuit.integrationDetails.body.dimensions.width, onchange: "IcDesigner.dimensions()"});
			Details.guiGenerator.option("Height", {type: "int", value: circuit.integrationDetails.body.dimensions.height, onchange: "IcDesigner.dimensions()"});
			Details.guiGenerator.hr();
			Details.guiGenerator.heading("Pins");
			for (var p of circuit.integrationDetails.pins)
			{
				Details.guiGenerator.text(`${p.name}`);
				Details.guiGenerator.button("Offset", `IcDesigner.offset("${p.name}")`, true);
				Details.guiGenerator.button("Side", `IcDesigner.side("${p.name}")`, true);
			}

		}
	},

	guiGenerator: {

		reset: function() {
			Details.target.innerHTML = "";
		},

		heading: function(text, id=null) {
			var h3 = document.createElement("h3");
			h3.innerHTML = text;
			h3.classList.add("detailsTitle");
			if (id)
				h3.id = id;
			Details.target.appendChild(h3);
		},

		text: function(text) {
			var p = document.createElement("p");
			p.innerHTML = text;
			Details.target.appendChild(p);
		},

		pre: function(text) {
			var p = document.createElement("pre");
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

			if (optData.type == "hidden")
				return;

			var l = document.createElement("label");
			l.setAttribute("for", `${Details.inputIdPrefix}${optName}`);
			l.innerHTML = optData.description? optData.description : optName;
			Details.target.appendChild(l);

			var o = Details.guiGenerator._opt[optData.type](optName, optData);
			o.id = `${Details.inputIdPrefix}${optName}`;
			o.name = `${Details.inputIdPrefix}${optName}`;

			if (optData.onchange)
				o.setAttribute("onchange", optData.onchange);

			Details.setInputAvailability(o);
			Details.target.appendChild(o);
		},

		_opt: {

			qty: function(name, data) {
				var i = document.createElement("input");
				i.setAttribute("type", "number");
				i.setAttribute("min", data.min? data.min : "1");
				i.setAttribute("max", data.max? data.max : "64");
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
				return Details.guiGenerator._opt.qty(name, data);
			},

			hidden: function(name, data) {
				var i = document.createElement("input");
				i.setAttribute("type", "hidden");
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
