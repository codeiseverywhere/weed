(window.SpaceStation.AjaxCart.ProvinceInput = function(AjaxCart, $, Behaviors) {
    "use strict";

    /**
     * Behavior that attaches itself to province input dropdowns.
     * 
     * Intended to work alongside a country input which will feed it provinces
     * to use.
     */
    function ProvinceInput() {
        Behaviors.init(ProvinceInput, this, arguments);

        this.$shipping_form = this.$elem.parents().find(AjaxCart.Shipping.QUERY);
        this.shipping = AjaxCart.Shipping.find_markup(this.$shipping_form)[0];

        if (this.shipping === undefined) {
            console.error("Province inputs should only be placed within a shipping form");
        }

        this.$country_inputs = this.$shipping_form.find(AjaxCart.CountryInput.QUERY);

        //This has to be on a separate stack frame to avoid recursive construction
        window.setTimeout(function () {
            this.country_input = AjaxCart.CountryInput.find_markup(this.$country_inputs)[0];

            if (this.country_input === undefined) {
                console.error("Province inputs are useless without a country input");
            }

            this.populate();
        }.bind(this), 0);
    }

    Behaviors.inherit(ProvinceInput, Behaviors.Behavior);

    ProvinceInput.QUERY = "[data-ajaxcart-shipping-provinceinput]";

    /**
     * Populate this province input with the current list of provinces.
     */
    ProvinceInput.prototype.populate = function() {
        var country = this.country_input.current_country(), i;

        this.$elem.find("option[value]").remove();

        if (country !== undefined) {
            for (i = 0; i < country.provinces.length; i += 1) {
                if (country.provinces[i][0] !== "---") {
                    this.$elem.append($("<option value='" + country.provinces[i][0] + "'>" + country.provinces[i][1] + "</option>"));
                }
            }

            if (country.provinces.length === 1) {
                this.$elem.val(country.provinces[0][0]);
            }

            if (country.provinces.length <= 1) {
                this.$elem.hide();
            } else {
                this.$elem.show();
            }
        } else {
            this.$elem.hide();
        }
    }

    Behaviors.register_behavior(ProvinceInput);
    
    return ProvinceInput;
}(window.SpaceStation.AjaxCart, window.jQuery, window.Behaviors));