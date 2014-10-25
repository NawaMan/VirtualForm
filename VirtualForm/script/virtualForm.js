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
	
	makeForm = function ($target, option_map) {
		if (!$target) {
			return;
		}
		$target = $($target);
		option_map = option_map || {};
		var widgetVar;
		
		var autoSubmits = $.makeArray($target.find("[data-submit-on]"));
		if ($target.is("[data-submit-on]")) {
			autoSubmits.push($target);
		}
		for (var i = 0; i < autoSubmits.length; i++) {
			var $autoSubmit = $(autoSubmits[i]);
			var submitOns = $autoSubmit.attr("data-submit-on");
			if (submitOns) {
				submitOns = submitOns.split(/[ \t\r\n]*,[ \t\r\n]*/);
				for (var s = 0; s < submitOns.length; s++) {
					var submitOn = submitOns[s];
					$autoSubmit.unbind(submitOn);
					$autoSubmit.bind(submitOn, function callSubmit() {
						widgetVar.submit();
					});
				}
			}
		}
		
		$target.bind('callSubmit', function () {
			var $This = $(this);
			var result = extractParameters($This);
			trigEvent($This, 'submit', {
				args   : Array.prototype.slice.call( arguments, 1 ),	// Remote 'this'
				values : result.values,
				fields : result.fields,
			});
		});
		
		widgetVar = {
			'submit': function() {
				var args = Array.prototype.slice.call( arguments, 0 );
				$target.trigger('callSubmit', args);
			}
		};
		
		if (($target.attr("data-var") != undefined)
		 || (("declareWidgetVar" in option_map) && (option_map.declareWidgetVar))) {
			declareWidgetVariable($target, widgetVar);
		}
		
		return widgetVar;
	};
	
	return {
		initModule : initModule,
		makeForm   : makeForm
	};
})(jQuery);