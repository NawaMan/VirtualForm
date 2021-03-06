/**
 * VirtualForm
 * 
 * VirtualForm is a JavaScript utility for HTML form fields.
 */

var virtualForm = (function($) {
	
	var initModule, makeForm;
	
	initModule = function() {
		
	};
	
	function extractParameterName($element) {
		var name = $element.attr("data-name");
		if (!name) {
			name = $element.attr("id");
		}
		if (!name) {
			name = $element.attr("name");
		}
		return name;
	}
	
	function extractParameterValue($element) {
		var  value = null;
		if ($element.is("input[type=checkbox]")) {
			value = ($element.attr('checked') == 'checked');
		} else {
			value = $element.val();
		}
		return value;
	}
	
	function extractParameters($target) {
		var fields = {};
		var values = {};
		
		// Button value will only count when it is the form.
		if ($target.is("input[type=button]")) {
			var name = extractParameterName($target);
			var value = $target.val();
			values[name] = value;
			fields[name] = {
				'value': value,
				'element': $target
			};
		} if ($target.is("input")) {
			var name = extractParameterName($target);
			var value = extractParameterValue($target);
			values[name] = value;
			fields[name] = {
				'value': value,
				'element': $target
			};
		} else {
			$target.find("input,select,textarea").each(function() {
				var $This = $(this);
				if ($This.is("input[type=button]")) {
					return;
				}
				
				var name = extractParameterName($This);
				var value = extractParameterValue($This);
				values[name] = value;
				fields[name] = {
					'value': value,
					'element': $This
				};
			});
		}
		return { 'fields': fields, 'values': values };
	}
	
	function declareWidgetVariable($target, widgetVar) {
		var varName = $target.attr('data-var');
		if (!varName) {
			varName = $target.attr('id');
		}
		if (varName) {
			window[varName] = widgetVar;
		}
	}
	
	function duplicateObject(data) {
		var newData = {};
		$.each(data, function(prop, value) {
			newData[prop] = data[prop];
		});
		return newData;
	}
	
	function trigEvent($element, name, data) {
		$element = $($element);
		var onName = "on" + name;
		var event = $.Event(name);
		$.each(data, function(prop, value) {
			event[prop] = data[prop];
		});
		try {
			var onSubmit = $element.attr(onName);
			if (onSubmit != null) {
				var submitFunct = function(event) {
					eval(onSubmit);
				};
				submitFunct.call($element, event);
				$element.attr(onName, '');
			}
			$element.trigger(event);
		} finally {
			if (onSubmit != null) {
				$element.attr(onName, onSubmit);
			}
		}
	}
	
	function prepareAutoSubmit($target, namespace, callSubmit) {
		var autoSubmits = $.makeArray($target.find("[data-submit-on]"));
		if ($target.is("[data-submit-on]")) {
			autoSubmits.push($target);
		}
		for (var i = 0; i < autoSubmits.length; i++) {
			var $autoSubmit = $(autoSubmits[i]);
			$autoSubmit.unbind(namespace);
			var submitOns = $autoSubmit.attr("data-submit-on");
			if (submitOns) {
				submitOns = submitOns.split(/[ \t\r\n]*,[ \t\r\n]*/);
				for (var s = 0; s < submitOns.length; s++) {
					var submitOn = submitOns[s];
					$autoSubmit.bind(submitOn + namespace, callSubmit);
				}
			}
		}
	}
	
	function prepareDefaultContig(config_map, defaults) {
		$.each(defaults, function(prop, value) {
			if (!(prop in config_map)) {
				config_map[prop] = value;
			}
		});
	}
	
	function prepareConfigFromAttribute($target, config_map) {
		var configPrefix = 'config';
		var data = $target.data();
		for (var d in data) {
			if (configPrefix != d.substring(0, configPrefix.length)) {
				continue;
			}
			
			var configName = d.substring(configPrefix.length);
			var firstChar = configName.substring(0,1);
			if (firstChar != firstChar.toUpperCase()) {
				continue;
			}
			configName = firstChar.toLowerCase() + configName.substring(1);
			config_map[configName] = data[d];
		}
	}
	
	function makeProps(object) {
		object._get = function(name, defaultValue, assign) {
			if (!name) {
				return defaultValue;
			}
			if (name in object) {
				return object[name];
			} else {
				if (arguments.length <= 1) {
					return null;
				} else {
					if ((arguments.length < 3) || !assign) {
						object[name] = defaultValue;
					}
					return defaultValue;
				}
			}
		};
		object._set = function(name, value) {
			if (arguments.length <= 1) {
				return;
			}
			object[name] = value;
		};
		object._has = function(name) {
			if (arguments.length <= 0) {
				return;
			}
			return (name in object);
		};
		object._remove = function(name) {
			if (arguments.length <= 0) {
				return;
			}
			if (!(name in object)) {
				return;
			}
			delete object[name];
		};
	}
	
	makeForm = function ($target, config_map, context_map) {
		if (!$target) {
			return;
		}
		$target = $($target);
		config_map = config_map || {};
		context_map = context_map || {};
		prepareDefaultContig(config_map, {
			specficOnly : true,
		});
		prepareConfigFromAttribute($target, config_map);
		
		var config = duplicateObject(config_map);
		var context = duplicateObject(context_map);
		var uniqueId = '' + Math.floor(Math.random()*1000000);
		var namespace = ".auto" + uniqueId;
		var widgetVar;
		
		var callSubmit = function() {
			widgetVar.submit();
		};
		
		// TODO - Think about share context regardless of the source.
		// TODO - Nested structure of `vform`.
		// TODO - data-validation
		// TODO - error (onInvalidate)
		// TODO - cancelSubmit
		// TODO - onPostSubmit
		// TODO - dirty fields
		
		prepareAutoSubmit($target, namespace, callSubmit);
		
		makeProps(config);
		makeProps(context);
		
		$target.bind('callSubmit', function (e) {
			// Case of missing id, all instance will be triggered.
			var isSpecific = false;
			if ('___uniqueId___' in e) {
				if (e.___uniqueId___ != uniqueId) {
					return;
				}
				isSpecific = true;
			}
			
			var $This = $(this);
			var result = extractParameters($This);
			var args = Array.prototype.slice.call( arguments, 1 );	// To remote 'this'
			var values = result.values;
			var fields = result.fields;
			makeProps(args);
			makeProps(values);
			makeProps(fields);
			
			trigEvent($This, 'submit', {
				args       : args,
				config     : config,
				values     : result.values,
				fields     : result.fields,
				context    : context,
				isSpecific : isSpecific,
			});
		});
		
		widgetVar = {
			'submit': function() {
				var args = Array.prototype.slice.call( arguments, 0 );
				var event = $.Event('callSubmit');
				event.___uniqueId___ = uniqueId;
				$target.trigger(event, args);
			},
			'updateAutoSubmit' : function() {
				prepareAutoSubmit($target, namespace, callSubmit);
			}
		};
		
		if (($target.attr("data-var") != undefined)
		 || !("declareWidgetVar" in config_map)
		 || (config_map.declareWidgetVar)) {
			declareWidgetVariable($target, widgetVar);
		}
		
		return widgetVar;
	};
	
	return {
		initModule : initModule,
		makeForm   : makeForm
	};
})(jQuery);