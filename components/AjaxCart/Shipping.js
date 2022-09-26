(window.SpaceStation.AjaxCart.Shipping = function(AjaxCart, $, Behaviors, Shopify, localStorage) {
    "use strict";

    /**
     * Behavior that manages estimated-shipping rates in the minicart.
     * 
     * Shopify provides an estimated shipping endpoint, but the customer needs
     * to provide a country, province, and postal code in an embedded form
     * before continuing.
     * 
     * Since this behavior will be part of a continuously-reloaded minicart,
     * we store the user's last-entered shipping data in local storage, and
     * retrieve it from there when we need to repopulate the form. Form
     * parameter names need to match the `/cart/shipping_rates.js` endpoint.
     */
    function Shipping() {
        Behaviors.init(Shipping, this, arguments);

        this.country_list = AjaxCart.CountryList.find_markup($(document))[0];
        if (this.country_list === undefined) {
            console.error("Shipping forms require a valid Shopify country list in order to work.");
        }

        this.$form = this.$elem.find("[data-ajaxcart-shipping-form]");
        this.$form.on("submit", this.edit_shipping_address_intent.bind(this));

        this.$price = this.$elem.find("[data-ajaxcart-shipping-price]");
        this.$destination = this.$elem.find("[data-ajaxcart-shipping-destination]");
        this.$edit_button = this.$elem.find("[data-ajaxcart-shipping-editbutton]");

        this.$edit_button.on("click", this.begin_edit_intent.bind(this));
        
        // These function calls may construct other behaviors, so we need to
        // end the stack frame...
        window.setTimeout(function () {
            AjaxCart.CountryInput.find_markup(this.$form);
            AjaxCart.ProvinceInput.find_markup(this.$form);

            // Oh, and since those inputs do the same thing, we have to wait
            // for them to resolve THEIR cyclic references before WE can use
            // them.
            window.setTimeout(function () {
                this.load_persisted_form_values();
                this.refresh_shipping_rate();
            }.bind(this), 0);
        }.bind(this), 0);
    }

    Behaviors.inherit(Shipping, Behaviors.Behavior);

    Shipping.QUERY = "[data-ajaxcart-shipping]";

    /**
     * Set the displayed price as shown to the user.
     * 
     * @param {string|undefined} price The current price, as a string.
     * 
     * An undefined price indicates that the price is indeterminate.
     */
    Shipping.prototype.set_price = function (price) {
        if (price != undefined) {
            this.$price.text(price);
        } else {
            this.$price.html("&mdash;");
        }
    }

    /**
     * Update the state of the shipping form based on whether or not we are
     * currently editing the edit form.
     * 
     * @param {bool} is_editing Whether or not we are currently in the 'edit'
     * mode.
     */
    Shipping.prototype.set_edit_state = function(is_editing) {
        this.edit_state = is_editing;

        if (is_editing) {
            this.$elem.addClass("is-AjaxCart-total--being_edited");
            this.$edit_button.addClass("is-AjaxCart-shipping_address_edit_button--being_edited");
            this.$form.addClass("is-AjaxCart-shipping_address_form--being_edited");
            this.set_price(undefined);
            this.populate_destination();
        } else {
            this.$elem.removeClass("is-AjaxCart-total--being_edited");
            this.$edit_button.removeClass("is-AjaxCart-shipping_address_edit_button--being_edited");
            this.$form.removeClass("is-AjaxCart-shipping_address_form--being_edited");
        }
    }

    /**
     * Set the displayed destination when the shipping address is not being
     * edited.
     * 
     * Components that are undefined will not be displayed to the user. If no
     * components are displayed then the destination indicator will be blank.
     * 
     * @param {string|undefined} method The shipping method selected.
     * 
     * Must be defined and have a name property in order to render the shipping
     * method.
     * 
     * @param {string|undefined} country The user's selected country value.
     * 
     * Must be defined and be a valid country as defined by Shopify in order to
     * render.
     * 
     * @param {string|undefined} province The user's selcted province value.
     * 
     * Must be defined and be a valid province of the selected country in order
     * to render.
     * 
     * @param {string|undefined} zip The user's ZIP input.
     * 
     * Must be defined in order to render.
     */
    Shipping.prototype.populate_destination = function(method, country, province, zip) {
        var method_name = "", components = [], countries = this.country_list.countries(),
            i;

        if (method && method.name) {
            components.push(method.name);
        }

        if (country && countries[country]) {
            components.push(countries[country].label);
        }

        if (country && province && countries[country]) {
            for (i = 0; i < countries[country].provinces.length; i += 1) {
                if (countries[country].provinces[0] === province) {
                    components.push(components[country].provinces[1]);
                }
            }
        }

        if (zip) {
            components.push(zip);
        }

        if (components.length > 0) {
            this.$destination.text("(" + components.join(", ") + ")");
        } else {
            this.$destination.text("");
        }
    }

    /**
     * Event handler for opening the edit form.
     * 
     * @param {*} evt The edit button click intent.
     */
    Shipping.prototype.begin_edit_intent = function(evt) {
        evt.preventDefault();
        this.set_edit_state(true);
    }

    /**
     * Retrieve the form values from the shipping form.
     * 
     * @returns A plain object of form values
     */
    Shipping.prototype.form_values = function() {
        var $inputs = this.$form.find("input[name], select[name], textarea[name]"),
            fval = {};
        
        $inputs.each(function (index, input_elem) {
            var $input_elem = $(input_elem),
                name = $input_elem.attr("name"),
                value = $input_elem.val();
            
            fval[name] = value;
        }.bind(this));
        
        return fval;
    }

    /**
     * Set one particular form value in the form.
     * 
     * All form elements with the given key must have been populated with those
     * values.
     * 
     * @param {string} key The name of the form value to change.
     * @param {string} value The value to set on all form elements matching the
     * key.
     */
    Shipping.prototype.set_form_value = function(key, value) {
        this.$form.find("input[name='" + key + "']").val(value.toString());
        this.$form.find("select[name='" + key + "']").val(value.toString());
        this.$form.find("textarea[name='" + key + "']").val(value.toString());
    }

    /**
     * Populate a list of input behaviors, and then set a form value.
     * 
     * @param {array} inputs A list of inputs to populate before changing the
     * value.
     * 
     * @param {string} key The name of the form value to change.
     * @param {string} value The value to set on all form elements matching the
     * key.
     */
    Shipping.prototype.populate_and_set_form_value = function(inputs, key, value) {
        var i;

        for (i = 0; i < inputs.length; i += 1) {
            inputs[i].populate();
        }

        this.set_form_value(key, value);
    }

    /**
     * Set the form values from a plain data object.
     * 
     * This function does not alter local storage or trigger user intents; you
     * will need to force an update if your intent was to, say, update the
     * calculated shipping rate.
     * 
     * @param {object} fval The form data as a plain object.
     * 
     * This parameter should have the properties `shipping_address[zip]`,
     * `shipping_address[country]`, and `shipping_address[province]` defined.
     * Any undefined property will cause the associated form value to not be
     * updated.
     */
    Shipping.prototype.set_form_values = function(fval) {
        var k,
            country_inputs = AjaxCart.CountryInput.find_markup(this.$form),
            province_inputs = AjaxCart.ProvinceInput.find_markup(this.$form);
        
        if (fval.hasOwnProperty("shipping_address[country]")) {
            this.populate_and_set_form_value(
                country_inputs,
                "shipping_address[country]",
                fval["shipping_address[country]"]
            );
        }
        
        if (fval.hasOwnProperty("shipping_address[province]")) {
            this.populate_and_set_form_value(
                province_inputs,
                "shipping_address[province]",
                fval["shipping_address[province]"]
            );
        }

        for (k in fval) {
            if (fval.hasOwnProperty(k) && fval[k] !== undefined && fval[k] !== null) {
                this.set_form_value(k, fval[k]);
            }
        }
    }

    /**
     * Store form data in local storage.
     */
    Shipping.prototype.persist_form_values = function() {
        var fval = this.form_values();

        try {
            localStorage.setItem("AjaxCart.shipping_addr", JSON.stringify(fval));
        } catch (exc) {
            console.log("Okay, fine, I didn't wanna store things anyway...");
        }
    }

    /**
     * Load form data from local storage and update the form.
     */
    Shipping.prototype.load_persisted_form_values = function() {
        var fval_string = localStorage.getItem("AjaxCart.shipping_addr"),
            fval = {};

        if (fval_string !== null) {
            fval = JSON.parse(fval_string);
        }

        this.set_form_values(fval);
    }

    /**
     * Event handler for submitting the form that allows customers to specify
     * their location.
     * 
     * @param {*} evt The form submission event.
     */
    Shipping.prototype.edit_shipping_address_intent = function(evt) {
        evt.preventDefault();

        this.persist_form_values();
        this.refresh_shipping_rate(Shopify.onError);
    }

    /**
     * Programmatically update the shipping rate.
     * 
     * @param {Function} error Error handler triggered if the shipping rate
     * could not be refreshed.
     */
    Shipping.prototype.refresh_shipping_rate = function(error) {
        var fval = this.form_values();

        this.$elem.addClass("is-AjaxCart-total--updating");
        
        $.ajax({
            url: "/cart/shipping_rates.json?",
            type: "GET",
            data: this.$form.serialize(),
            success: function(data, textStatus, jqXHR) {
                var i = 0, lowest_shipping_cost = Infinity, lowest_shipping_method;

                this.$elem.removeClass("is-AjaxCart-total--updating");

                for (i = 0; i < data.shipping_rates.length; i += 1) {
                    if (data.shipping_rates[i].price < lowest_shipping_cost) {
                        lowest_shipping_cost = parseFloat(data.shipping_rates[i].price);
                        lowest_shipping_method = i;
                    }
                }
                
                this.set_edit_state(false);
                this.set_price(lowest_shipping_cost);
                this.populate_destination(data.shipping_rates[lowest_shipping_method], fval.zip, fval.country, fval.province);
            }.bind(this),
            error: function() {
                this.$elem.removeClass("is-AjaxCart-total--updating");

                error.apply(this, arguments)
            }.bind(this),
        });
    }

    Behaviors.register_behavior(Shipping);

    return Shipping;
}(window.SpaceStation.AjaxCart,
    window.jQuery,
    window.Behaviors,
    window.Shopify,
    window.localStorage));