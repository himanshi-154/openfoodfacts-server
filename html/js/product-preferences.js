/*global lang */
/*global page_type*/ // depends on which type of page the preferences are shown on
/*global preferences_text*/ // depends on which type of page the preferences are shown on

var attribute_groups;	// All supported attribute groups and attributes + translated strings
var preferences;	// All supported preferences + translated strings
var use_user_product_preferences_for_ranking = JSON.parse(localStorage.getItem('use_user_product_preferences_for_ranking'));

function get_user_product_preferences () {
	// Retrieve user preferences from local storage

	var user_product_preferences = {};
	var user_product_preferences_string = localStorage.getItem('user_product_preferences');

	if (user_product_preferences_string) {
		user_product_preferences = JSON.parse(user_product_preferences_string);
	}
	else {
		// Default preferences
		user_product_preferences = { "nutriscore" : "very_important", "nova" : "important", "ecoscore" : "important" };
	}
	
	return user_product_preferences;
}

// display a summary of the selected preferences
// in the order mandatory, very important, important

function display_selected_preferences (target_selected_summary, product_preferences) {
	
	var selected_preference_groups = {
		"mandatory" : [],
		"very_important" : [],
		"important" : [],
	};
	
	// Iterate over attribute groups
	$.each( attribute_groups, function(key, attribute_group) {
		
		// Iterate over attributes
		
		$.each(attribute_group.attributes, function(key, attribute) {
			
			if ((product_preferences[attribute.id]) && (product_preferences[attribute.id] != "not_important")) {
				var attribute_html = '<li>' + attribute.setting_name + '</li>';
				selected_preference_groups[product_preferences[attribute.id]].push(attribute_html);
			}
		});
	});	

	var selected_preferences_html = '';

	$.each(selected_preference_groups, function(selected_preference, selected_preference_group) {
		
		var selected_preference_name;
		
		$.each(preferences, function (key, preference) {
					
			if (selected_preference == preference.id) {
				selected_preference_name = preference.name;
			}
		});
		
		if (selected_preference_group.length > 0) {
			selected_preferences_html += "<div>"
			+ "<strong>" + selected_preference_name + "</strong>"
			+ "<ul>" + selected_preference_group.join("") + "</ul>"
			+ "</div>";
		}
	});
	
	// dropdown link to see a preferences summary
	// html = '<a id="preferences_link" data-dropdown="selected_preferences">'
	lang().see_your_preferences + '</a></p>'
	+ '<div id="selected_preferences" data-dropdown-content class="f-dropdown content medium">' 
	+ selected_preferences_html
	+ '</div>';		
			
	$( target_selected_summary ).html(html);
	
	$(document).foundation('reflow');
}


// display a switch to use preferences (on list of products pages) and a button to edit preferences

function display_use_preferences_switch_and_edit_preferences_button (target_selected, target_selection_form, change) {
	
	var html = '';
	
	var html_edit_preferences = '<a id="show_selection_form" class="button small" style="margin-left:3em;">'
		+ '<img src="/images/icons/dist/food-cog.svg" class="icon" style="filter:invert(1)">'
		+ " " + lang().preferences_edit_your_food_preferences + '</a>';
	
	// Display a switch for classifying according to the user preferences if
	// we are on a page with multiple products
	
	if (page_type == 'products') {
		
		var checked = '';
		if (use_user_product_preferences_for_ranking) {
			checked = " checked";
		}
	
		html += '<div class="switch round" style="float:left;margin-right:.5rem;padding-top:0.1rem;"><input id="preferences_switch" type="checkbox"' + checked + '>'
		+ '<label for="preferences_switch"></label></div>'
		+ '<label for="preferences_switch" style="float:left;margin-right:1em;padding-top:0.5rem;">' + preferences_text + '</label>' + html_edit_preferences;
	}
	else {
		
		html += preferences_text + html_edit_preferences;
	}
			
	$( target_selected ).html(html);
	
	if (page_type == 'products') {
		$("#preferences_switch").change(function() {
			
			localStorage.setItem('use_user_product_preferences_for_ranking', this.checked);
			use_user_product_preferences_for_ranking = this.checked;
				
			// Call the change callback if we have one (e.g. to update search results)
			if (change) {
				change();
			}	
		});
	}
		
	$( "#show_selection_form").click(function() {
		$( target_selected ).hide();
		$( target_selection_form ).show();
		$(document).foundation('equalizer', 'reflow');
	});
	
	$(document).foundation('reflow');
}


// display_user_product_preferences can be called by other scripts
/* exported display_user_product_preferences */

// Make sure we display the preferences only once when we have both preferences and attribute_groups loaded
var displayed_user_product_preferences = false;

function display_user_product_preferences (target_selected, target_selection_form, change) {

	// Retrieve all the supported attribute groups from the server, unless we have them already
	
	if (! attribute_groups) {
		
		$.getJSON( "/api/v0/attribute_groups", function( data ) {
		
			attribute_groups = data;
		
			display_user_product_preferences(target_selected, target_selection_form, change);
		});
	}
	
	if (! preferences) {
		
		$.getJSON( "/api/v0/preferences", function( data ) {
		
			preferences = data;
		
			display_user_product_preferences(target_selected, target_selection_form, change);
		});		
	}
	
	if (attribute_groups && preferences && ! displayed_user_product_preferences) {
		
		displayed_user_product_preferences = true;
		
		var user_product_preferences = get_user_product_preferences();
		
		var attribute_groups_html = [];
		
		// Iterate over attribute groups
		$.each( attribute_groups, function(key, attribute_group) {
			
			var attribute_group_html = "<li id='attribute_group_" + attribute_group.id + "' class='attribute_group accordion-navigation'>" 
			+ "<a href='#attribute_group_" + attribute_group.id + "_a' style='color:black;'>"
			+ "<span class='attribute_group_name'>" + attribute_group.name + "</span></a>"
			// I can't get the dynamically created accordion to work, making all content active until we find a way to make it work
			+ "<div id='attribute_group_" + attribute_group.id + "_a' class='content active'>";
			
			if (attribute_group.warning) {
				attribute_group_html += "<div class='alert-box warning attribute_group_warning'>" + attribute_group.warning + "</div>";
			}
			
			attribute_group_html += "<ul style='list-style-type: none'>";
			
			// Iterate over attributes
			
			$.each(attribute_group.attributes, function(key, attribute) {
				
				attribute_group_html += "<li id='attribute_" + attribute.id + "' class='attribute'>"
				+ "<div style='width:96px;float:left;margin-right:1em;'><img src='" + attribute.icon_url + "' class='match_icons'></div>"
				+ "<span class='attribute_name'>" + attribute.setting_name + "</span><br>";
							
				$.each(preferences, function (key, preference) {
					
					var checked = '';
					
					if ((! user_product_preferences[attribute.id] && preference.id == "not_important") || (user_product_preferences[attribute.id] == preference.id)) {
						checked = ' checked';
					}
					
					attribute_group_html += "<input class='attribute_radio' id='attribute_" + attribute.id + "_" + preference.id
					+ "' value='" + preference.id + "' type='radio' name='" + attribute.id + "'" + checked + ">"
					+ "<label for='attribute_" + attribute.id + "_" + preference.id + "'>" + preference.name + "</label>"
					+ "</input>";
				});
				
				if (attribute.description_short) {
					attribute_group_html += "<p class='attribute_description_short'>" + attribute.description_short + "</p>";
				}
				
				attribute_group_html += "<hr style='clear:left;border:none;margin:0;margin-bottom:0.5rem;padding:0;'>";
				
				attribute_group_html += "</li>";
			});
						
			attribute_group_html += "</ul></div></li>";
			
			attribute_groups_html.push(attribute_group_html);
		});

		$(target_selection_form).html(
			'<div class="panel callout">'
			+ '<div class="edit_button">'
			+ '<a class="show_selected button small">'
			+ '<img src="/images/icons/dist/cancel.svg" class="icon" style="filter:invert(1)">'
			+ " " + lang().close + '</a></div>'
			+ "<h2>" + lang().preferences_edit_your_food_preferences + "</h2>"
			+ "<p>" + lang().preferences_locally_saved + "</p>"
			+ '<a id="delete_all_preferences_button" class="button small">' + lang().delete_all_preferences + '</a>'
			+ '<ul id="user_product_preferences" class="accordion" data-accordion>'
			+ attribute_groups_html.join( "" )
			+ '</ul>'
			+ '<br><br>'
			+ '<div class="edit_button">'
			+ '<a class="show_selected button small">'
			+ '<img src="/images/icons/dist/cancel.svg" class="icon" style="filter:invert(1)">'
			+ " " + lang().close + '</a></div><br><br>'
			+ '</div>'
		);
		
		$( ".attribute_radio").change( function () {
			if (this.checked) {

				user_product_preferences[this.name] = $("input[name='" + this.name + "']:checked").val();
				localStorage.setItem('user_product_preferences', JSON.stringify(user_product_preferences));
				
				display_use_preferences_switch_and_edit_preferences_button(target_selected, target_selection_form, change);
				
				// Call the change callback if we have one (e.g. to update search results)
				if (change) {
					change();
				}
			}
		});
			
		if (target_selected) {	
			display_use_preferences_switch_and_edit_preferences_button(target_selected, target_selection_form, change);
		}

		$( "#delete_all_preferences_button").click(function() {
			user_product_preferences = {};
			localStorage.setItem('user_product_preferences', JSON.stringify(user_product_preferences));
			
			// Redisplay user preferences
			displayed_user_product_preferences = false;
			display_user_product_preferences(target_selected, target_selection_form, change);
			
			// Call the change callback if we have one (e.g. to update search results)
			if (change) {
				change();
			}
		});

		$( ".show_selected").click(function() {
			$( target_selection_form ).hide();
			$( target_selected ).show();
		});

		$("#user_product_preferences").foundation();
		$(document).foundation('equalizer', 'reflow');
	}
}
