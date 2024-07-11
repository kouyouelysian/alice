var ToolBar = {

	target: "toolbar",

	presets: {
		"default": [
			{"text":"Test", "onclick":"alert(1)"}
		],
		"simViewport": [
			{"text":"Run", "onclick":"window.sim.run()"},
			{"text":"Stop", "onclick":"window.sim.stop()"},
			{"text":"Reset", "onclick":"window.sim.reset()"}
		],
		"noteArea": [
			{"text":"Edit", "onclick":"HierarchyManager.note.edit()"}
		],
		"noteEditor": [
			{"text":"Update As HTML", "onclick":"HierarchyManager.note.save('html')"},
			{"text":"Update As Plaintext", "onclick":"HierarchyManager.note.save('plaintext')"}
		]
	},

	load: function(preset="default") {
		var t = document.getElementById(ToolBar.target);
		if (!t)
			return;
		else
			t.innerHTML = "";
		if (!preset)
			return;
		for (var pitem of ToolBar.presets[preset])
			t.appendChild(ToolBar.makeCommandButton(pitem.text, pitem.onclick));
	},

	makeCommandButton(text, onclick) {
		var p = document.createElement("p");
		p.classList.add("command");
		p.innerHTML = text;
		p.setAttribute("onclick", onclick);
		return p;
	}
}