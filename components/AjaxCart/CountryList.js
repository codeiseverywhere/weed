(window.SpaceStation.AjaxCart.CountryList = function($, Behaviors) {
    "use strict";

    /**
     * Static country and province source list.
     * 
     * This is intended to attach to an HTML template holding the markup of the
     * Liquid object `country_option_tags`; it then parses that markup to
     * provide a list of countries and provinces as understood by Shopify.
     * 
     * This behavior does nothing by itself.
     */
    function CountryList() {
        Behaviors.init(CountryList, this, arguments);

        if ("content" in this.$elem[0]) {
            this.$content = $(this.$elem[0].content);
        } else {
            this.$content = this.$elem.children();
        }
    }

    Behaviors.inherit(CountryList, Behaviors.Behavior);

    CountryList.QUERY = "[data-minicart-countrylist]";

    /**
     * Retrieve an associative array of all countries in the list.
     * 
     * Each country is an object listing it's value, user-facing label, and
     * it's provinces.
     */
    CountryList.prototype.countries = function() {
        var countries = {};

        if (this.country_list != undefined) {
            return this.country_list;
        }

        this.$content.find("option").each(function (index, option) {
            var $option = $(option),
                value = $option.attr("value"),
                label = $option.text(),
                provinces = $option.data("provinces");
            
            countries[value] = {
                "value": value,
                "label": label,
                "provinces": provinces
            };
        }.bind(this));

        this.country_list = countries;
        return countries;
    }

    Behaviors.register_behavior(CountryList);

    return CountryList;
}(window.jQuery, window.Behaviors));