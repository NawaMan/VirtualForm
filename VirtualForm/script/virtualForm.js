/**
 * VirtualForm
 * 
 * VirtualForm is a JavaScript utility for HTML form fields.
 */

var virtualForm = (function($) {
	
	var initModule, makeForm;
	
	initModule = function() {
		
	};
	
	makeForm = function ($target) {
		if (!$target) {
			return;
		}
		$target = $($target);
	};
	
	return {
		initModule : initModule,
		makeForm   : makeForm
	};
})(jQuery);