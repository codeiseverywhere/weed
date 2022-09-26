(window.SpaceStation.AjaxCart.Notification = function(AjaxCart, $, Behaviors, betteroffcanvas, Shopify) {
    "use strict";
    
    /**
     * Behavior that manages the notification widget on the minicart icon.
     */
    function Notification() {
        Behaviors.init(Notification, this, arguments);

        AjaxCart.MiniCart.hooks.attach("alter_cart_data", this.cart_update_intent.bind(this));
    }

    Behaviors.inherit(Notification, Behaviors.Behavior);

    Notification.QUERY = "[data-minicart-notification]";

    /**
     * Event handler for notifications.
     * 
     * @param {Object} data The cart data, assumed to come from `MiniCart`'s
     * cart hook implementation.
     */
    Notification.prototype.cart_update_intent = function(data) {
        this.$elem.text(data.item_count);
        
        if (data.item_count > 0) {
            this.$elem.show();
        } else {
            this.$elem.hide();
        }
    }

    Behaviors.register_behavior(Notification);

    return Notification;
}(window.SpaceStation.AjaxCart,
    window.jQuery,
    window.Behaviors,
    window.betteroffcanvas,
    window.Shopify));