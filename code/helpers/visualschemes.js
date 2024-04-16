
sizing = 25;
defaultSize = 
{
	"grid": sizing,
	"junction": {
		"normal": 1.5,
		"big": 4
	},
	"wire": 3,
	"device": 3,
	"cursor": {
		"radius": 3,
		"width": 1.5
	}
}


var VisualSchemes = {	

	default: {
		"color": {
			"fill": "white",
			"false": "#000",
			"undefined": "#999",
			"true": "#0A0",
			"selected": "#1BD",
			"highlighted": "#F0B",
			"devices": "#000"
		},
		"size": defaultSize
	},

	dark: {
		"color": {
			"fill": "black",
			"false": "white",
			"undefined": "#666",
			"true": "#0E0",
			"selected": "#1BD",
			"highlighted": "#F0B",
			"devices": "white"
		},
		"size": defaultSize
	}

}

delete sizing;
delete defaultSize;