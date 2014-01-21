/*
	JSON-to-Go
	by Matt Holt

	https://github.com/mholt/json-to-go

	A simple utility to translate JSON into a Go type definition.
*/

function jsonToGo(json, typename)
{
	var data;
	var scope;
	var go = "";
	var tabs = 0;

	try
	{
		data = JSON.parse(json);
		scope = data;
	}
	catch (e)
	{
		return {
			go: "",
			error: e.message
		};
	}

	typename = format(typename);

	if (!typename)
		typename = "GIVE_ME_A_NAME";

	append("type "+typename+" ");

	parseScope(scope);

	return { go: go };



	function parseScope(scope)
	{
		if (typeof scope === "object")
		{
			if (Array.isArray(scope))
			{
				var sliceType;
				for (var i = 0; i < scope.length; i++)
				{
					var thisType = goType(scope[i]);
					if (!sliceType)
						sliceType = thisType;
					else if (sliceType != thisType)
					{
						sliceType = mostSpecificPossibleGoType(thisType, sliceType);
						if (sliceType == "interface{}")
							break;
					}
				}
				append("[]");
				if (sliceType == "struct")
					parseScope(scope[0]);
				else
					append(sliceType);
			}
			else
			{
				append("struct {\n");
				++tabs;
				var keys = Object.keys(scope);
				for (var i in keys)
				{
					var keyname = keys[i];
					indent(tabs);
					append(format(keyname)+" ");
					parseScope(scope[keyname]);
					append(' `json:"'+keyname+'"`\n');
				}
				indent(--tabs);
				append("}");
			}
		}
		else
			append(goType(scope));
	}

	function indent(tabs)
	{
		for (var i = 0; i < tabs; i++)
			go += '\t';
	}

	function append(str)
	{
		go += str;
	}

	function format(str)
	{
		return toProperCase(str.replace(/\s/g, "_")).replace(/_/g, "");
	}

	function goType(val)
	{
		switch (typeof val)
		{
			case "string":
				return "string";
			case "number":
				if (val % 1 === 0)
				{
					if (val > -2147483648 && val < 2147483647)
						return "int"
					else
						return "int64"
				}
				else
					return "float32"
			case "object":
				return "struct";
			case "array":
				return "slice";
			default:
				return "interface{}";
		}
	}

	function mostSpecificPossibleGoType(typ1, typ2)
	{
		if (typ1.substr(0, 5) == "float"
				&& typ2.substr(0, 3) == "int")
			return typ1;
		else if (typ1.substr(0, 3) == "int"
				&& typ2.substr(0, 5) == "float")
			return typ1;
		else
		{
			return "interface{}";
		}
	}

	// Thanks to http://stackoverflow.com/a/5574446/1048862
	function toProperCase(str)
	{
		return str.replace(/[^_]*/gi, function(txt) 
		{
			return txt.charAt(0).toUpperCase()
					+ txt.substr(1).toLowerCase();
		});
	}
}