/**
 * VirtualForm
 * 
 * VirtualForm is a JavaScript utility for HTML form fields.
 */

var virtualForm = (function($) {
	
	var initModule, makeForm;
	
	initModule = function() {
		
	};
	
	function extractParameters($target) {
		var fields = {};
		var values = {};
		$target.find("input,select,textarea").each(function() {
			var $This = $(this);
			if ($This.is("input[type=button]")) {
				return;
			}
			var name = $This.attr("data-name");
			if (!name) {
				name = $This.attr("id");
			}
			if (!name) {
				name = $This.attr("name");
			}
			var value;
			if ($This.is("input[type=checkbox]")) {
				value = ($This.attr('checked') == 'checked');
			} else {
				value = $This.val();
			}
			values[name] = value;
			fields[name] = {
				'value': value,
				'element': $This
			};
		});
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
	
	makeForm = function ($target, option_map) {
		if (!$target) {
			return;
		}
		$target = $($target);
		option_map = option_map || {};
		
		$target.bind('callSubmit', function () {
			var $This = $(this);
			var result = extractParameters($This);
			var event = $.Event("submit");
			event.args = Array.prototype.slice.call( arguments, 1 );
			event.values = result.values;
			event.fields = result.fields;
			$target.trigger(event);
		});
		
		var widgetVar = {
			'submit': function() {
				var args = Array.prototype.slice.call( arguments, 0 );
				$target.trigger('callSubmit', args);
			}
		};
		
		if (($target.attr("data-var") != "")
		 || (("declare_var" in option_map) && (option_map.declare_var))) {
			declareWidgetVariable($target, widgetVar);
		}
		
		return widgetVar;
	};
	
	return {
		initModule : initModule,
		makeForm   : makeForm
	};
})(jQuery);