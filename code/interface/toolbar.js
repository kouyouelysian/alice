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
			{"text":"Edit", "onclick":"window.sim.noteEdit()"}
		],
		"noteEditor": [
			{"text":"Update As HTML", "onclick":"window.sim.noteSave('html')"},
			{"text":"Update As Plaintext", "onclick":"window.sim.noteSave('plaintext')"}
		]
	},

	load: function(preset="default") {
		var t = document.getElementById(ToolBar.target);
		if (!t)
			return;
		else
			t.innerHTML = "";

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