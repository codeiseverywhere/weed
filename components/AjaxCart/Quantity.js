(window.SpaceStation.AjaxCart.Quantity = function(AjaxCart, $, Behaviors, Shopify) {
    "use strict";

    /**
     * Behavior that attaches itself to quantity selectors.
     * 
     * This behavior expects to be attached either directly to an input, or a
     * parent of that input. When the input is adjusted, the associated line
     * item will be updated and the minicart refreshed.
     */
    function Quantity() {
        Behaviors.init(Quantity, this, arguments);

        this.id = this.$elem.data("ajaxcart-quantity-lineitem");

        this.$target_input = this.$elem.filter("input");
        if (this.$target_input.length == 0) {
            this.$target_input = this.$elem.find("input");
        }

        this.initial_value = parseInt(this.$target_input.val());

        this.$target_input.on("change blur", this.change_intent.bind(this));

        this.minicart = AjaxCart.MiniCart.find_markup(this.$elem.parents())[0];
    }

    Behaviors.inherit(Quantity, Behaviors.Behavior);

    Quantity.QUERY = "[data-ajaxcart-quantity]";

    /**
     * Indicate that the quantity has changed according to some user-intent
     * action.
     * 
     * This intent is debounced: multiple repeated calls to `change_intent`
     * will not immediately change the resulting value in the cart.
     */
    Quantity.prototype.change_intent = function() {
        if (this.timeout !== undefined) {
            window.clearTimeout(this.timeout);
        }

        this.$elem.addClass("is-AjaxCart-item_quantity_selector--updating");

        this.timeout = window.setTimeout(this.debounced_change_intent.bind(this), 500);
    }

    Quantity.prototype.debounced_change_intent = function() {
        var new_qty = parseInt(this.$target_input.val());

        delete this.timeout;

        if (new_qty == this.initial_value || isNaN(new_qty)) {
            this.$elem.removeClass("is-AjaxCart-item_quantity_selector--updating");
            return;
        }

        if (this.minicart) {
            this.minicart.indicate_update();
        }

        $.ajax({
            url: "/cart/change.js",
            type: "POST",
            data: {
                quantity: new_qty,
                id: this.id
            },
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                Shopify.onCartUpdate(data);
            }.bind(this),
            error: function(jqXHR, textStatus, errorThrown) {
                Shopify.onError(jqXHR, textStatus);
            }.bind(this),
        })
    }

    Behaviors.register_behavior(Quantity);
    
    return Quantity
}(window.SpaceStation.AjaxCart || {},
    window.jQuery,
    window.Behaviors,
    window.Shopify));