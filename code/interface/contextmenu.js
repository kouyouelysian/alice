var ContextMenu = {

	target: null,
	backdrop: null,

	presets: {
		"default": [
			{
				"text": "alert 1",
				"onclick": "alert(1)"
			},
			{
				"text": "no action available"
			}
		]
	},

	onload: function(targetId = "contextMenu") {
		ContextMenu.target = document.getElementById(targetId);
		ContextMenu.backdrop = document.getElementById(`${targetId}Backdrop`);
		document.addEventListener('contextmenu', function(event) {
			ContextMenu.optionsFill();
			ContextMenu.show(event.clientX, event.clientY);
			event.preventDefault();
		});
	},

	optionsFill: function(presetName="default") {
		ContextMenu.target.innerHTML = "";
		for (var option of ContextMenu.presets[presetName])
		{
			var item = document.createElement("li");
			item.innerHTML = option.text;
			if (option.onclick)
				item.setAttribute("onclick", `ContextMenu.hide(); ${option.onclick}`);
			else
				item.classList.add("inactive");
			ContextMenu.target.appendChild(item);
		}
	}, 

	show: function(x=0, y=0) {
		ContextMenu.target.style.display = "block";
		ContextMenu.target.style.left = `${x}px`;
		ContextMenu.target.style.top = `${y}px`;
		ContextMenu.backdrop.style.display = "block";
	},

	hide: function() {
		ContextMenu.target.removeAttribute("style");
		ContextMenu.backdrop.removeAttribute("style");
	}

}