(window.SpaceStation.AjaxCart.Remove = function(AjaxCart, $, Behaviors, Shopify) {
    "use strict";

    /**
     * Behavior that attaches itself to remove buttons.
     */
    function Remove() {
        Behaviors.init(Remove, this, arguments);

        this.id = this.$elem.data("ajaxcart-remove-lineitem");

        this.$elem.on("click", this.remove_intent.bind(this));

        this.minicart = AjaxCart.MiniCart.find_markup(this.$elem.parents())[0];
    }

    Behaviors.inherit(Remove, Behaviors.Behavior);

    Remove.QUERY = "[data-ajaxcart-remove]";

    /**
     * When clicked, remove buttons should remove their associated line item.
     */
    Remove.prototype.remove_intent = function(evt) {
        evt.preventDefault();

        this.$elem.addClass("is-AjaxCart-item_remove--updating");

        if (this.minicart) {
            this.minicart.indicate_update();
        }

        $.ajax({
            url: "/cart/change.js",
            type: "POST",
            data: {
                quantity: 0,
                id: this.id
            },
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                Shopify.onCartUpdate(data);
            }.bind(this),
            error: function(jqXHR, textStatus, errorThrown) {
                Shopify.onError(jqXHR, textStatus);
            }.bind(this),
        });
    }

    Behaviors.register_behavior(Remove);
    
    return Remove;
}(window.SpaceStation.AjaxCart,
    window.jQuery,
    window.Behaviors,
    window.Shopify));