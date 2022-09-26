(window.SpaceStation.AjaxCart.CountryInput = function(AjaxCart, $, Behaviors) {
    "use strict";

    /**
     * Behavior that attaches itself to country input dropdowns.
     * 
     * Intended to work alongside a province input, and requires a CountryList
     * in order to work.
     */
    function CountryInput() {
        Behaviors.init(CountryInput, this, arguments);

        this.$elem.on("change", this.select_intent.bind(this));

        this.country_list = AjaxCart.CountryList.find_markup($(document))[0];
        if (this.country_list === undefined) {
            console.error("Country inputs require a valid Shopify country list in order to work.");
        }

        this.$shipping_form = this.$elem.parents().find(AjaxCart.Shipping.QUERY);
        this.shipping = AjaxCart.Shipping.find_markup(this.$shipping_form)[0];

        if (this.shipping === undefined) {
            console.error("Country inputs should only be placed within a shipping form");
        }

        this.$province_inputs = this.$shipping_form.find(AjaxCart.ProvinceInput.QUERY);

        //This has to be on a separate stack frame to avoid recursive construction
        window.setTimeout(function () {
            this.province_inputs = AjaxCart.ProvinceInput.find_markup(this.$province_inputs);
        }.bind(this), 0);

        this.populate();
    }

    Behaviors.inherit(CountryInput, Behaviors.Behavior);

    CountryInput.QUERY = "[data-ajaxcart-shipping-countryinput]";

    /**
     * Populate this country input with the current list of countries.
     */
    CountryInput.prototype.populate = function() {
        var countries = this.country_list.countries(), country_value;

        this.$elem.find("option[value]").remove();

        for (country_value in countries) {
            if (countries.hasOwnProperty(country_value) && country_value !== "---") {
                this.$elem.append($("<option value='" + country_value + "'>" + countries[country_value].label + "</option>"));
            }
        }
    }

    /**
     * Retrieve the currently selected country.
     */
    CountryInput.prototype.current_country = function() {
        return this.country_list.countries()[this.$elem.val()];
    }

    /**
     * Event handler for when someone selects a country.
     */
    CountryInput.prototype.select_intent = function() {
        var i;

        for (i = 0; i < this.province_inputs.length; i += 1) {
            this.province_inputs[i].populate();
        }
    }

    Behaviors.register_behavior(CountryInput);
    
    return CountryInput;
}(window.SpaceStation.AjaxCart, window.jQuery, window.Behaviors));