(window.SpaceStation.AjaxCart.QuantityToggle = function(AjaxCart, Behaviors) {
    "use strict";

    /**
     * Behavior that attaches itself to a quantity increase/decrease button and
     * adjusts a neighboring quantity field.
     */
    function QuantityToggle() {
        Behaviors.init(QuantityToggle, this, arguments);

        this.$target_input = this.$elem.siblings().filter("input");
        this.adjustment = this.$elem.data("ajaxcart-quantitytoggle");

        this.$elem.on("click", this.quantity_toggle_intent.bind(this));
    }

    Behaviors.inherit(QuantityToggle, Behaviors.Behavior);

    QuantityToggle.QUERY = "[data-ajaxcart-quantitytoggle]";

    QuantityToggle.prototype.quantity_toggle_intent = function() {
        var i, qty_instances;

        this.$target_input.val(parseInt(this.$target_input.val()) + this.adjustment);

        qty_instances = AjaxCart.Quantity.find_markup(this.$elem.parents());

        for (i = 0; i < qty_instances.length; i += 1) {
            qty_instances[i].change_intent();
        }
    }

    Behaviors.register_behavior(QuantityToggle);
    
    return QuantityToggle;
}(window.SpaceStation.AjaxCart, window.Behaviors));