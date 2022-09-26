(window.SpaceStation.AjaxCart.MiniCart = function(AjaxCart, $, Behaviors, betteroffcanvas, Shopify) {
    "use strict";

    /**
     * Core behavior for managing a minicart.
     * 
     * This behavior should locate onto the element which will actually contain
     * the contents of your minicart. It is responsible for keeping the
     * minicart contents in sync with cart changes. Any code that updates the
     * cart should either trigger a page reload or update the minicart using
     * this behavior.
     * 
     * This behavior can be attached to an Offcanvas target; the open event
     * will be used to kick off cart rendering.
     */
    function MiniCart() {
        Behaviors.init(MiniCart, this, arguments);

        this.money_format = this.$elem.data("minicart-moneyformat");
        this.friendly_error = this.$elem.data("minicart-friendlyerror");
        this.$elem.on("offcanvas-open", this.open_intent.bind(this));
        this.$elem.on("offcanvas-dismiss", this.close_intent.bind(this));

        this.open = false;
        this.last_cart = undefined;
    }
    
    Behaviors.inherit(MiniCart, Behaviors.Behavior);
    
    MiniCart.QUERY = "[data-minicart]";

    MiniCart.hooks = new Behaviors.Hooks();
    MiniCart.hooks.define_hook_type("alter_cart_data");

    /**
     * Find the first clickable toggle for this minicart.
     */
    MiniCart.prototype.find_first_toggle = function() {
        var my_id = this.$elem.attr("id");

        return $("[data-toggle='offcanvas'][data-target='#" + my_id + "']")[0];
    }

    /**
     * Programmatically open the minicart toggle.
     * 
     * @param {string|undefined} event_name The event name that triggered this
     * open. Standard event names will trigger a cart refresh upon opening the
     * toggle, as they indicate user interaction. If unspecified, then no
     * refresh will occur.
     */
    MiniCart.prototype.open_cart = function (event_name) {
        var toggle = this.find_first_toggle(),
            $toggle = $(toggle);

        if (toggle !== undefined && !this.open) {
            betteroffcanvas.dismissOpenOffcanvas();
            betteroffcanvas.initOffcanvas(this.$elem);
            betteroffcanvas.initOffcanvasToggle($toggle);
            betteroffcanvas.openOffcanvas(this.$elem, $(toggle), event_name ? event_name : "program");
        }
    }

    /**
     * Programmatically close the minicart toggle.
     */
    MiniCart.prototype.close_cart = function () {
        var toggle = this.find_first_toggle();

        if (toggle !== undefined && this.open) {
            betteroffcanvas.dismissOffcanvas(this.$elem);
        }
    }

    /**
     * Event handler which is fired whenever this is opened as an Offcanvas
     * target.
     */
    MiniCart.prototype.open_intent = function(evt) {
        this.open = true;

        if (evt.source_event_type !== "cart_update" && evt.source_event_type !== "program") {
            this.refresh();
        }
    }

    /**
     * Event handler which is fired whenever this is closed as an Offcanvas
     * target.
     */
    MiniCart.prototype.close_intent = function() {
        this.open = false;
        this.$elem.children().remove();
    }

    /**
     * Load and update the contents of the minicart.
     */
    MiniCart.prototype.refresh = function () {
        $.getJSON('/cart.js', function (cart, textStatus) {
            this.last_cart = cart;
            this.update_cart(cart);
        }.bind(this)).fail(function (jqXHR, textStatus, error) {
            this.update_cart_error(textStatus + ", ", error);
        }.bind(this));
    }

    /**
     * Event handler which is fired whenever the Shopify API gets new cart
     * information.
     */
    MiniCart.prototype.cart_update_intent = function(cart) {
        this.last_cart = cart;
        
        this.open_cart("cart_update");
        this.update_cart(cart);

        this.indicate_update_complete();
    }

    /**
     * Event handler which is fired whenever an item is added to the cart.
     */
    MiniCart.prototype.item_added_intent = function(line_item) {
        if (this.open) {
            this.refresh();
        } else {
            this.open_cart("item_added");
        }

        this.indicate_update_complete();
    }
    
    /**
     * Update the minicart with data retrieved from Shopify's API.
     */
    MiniCart.prototype.update_cart = function (data) {
        data.money_format = this.money_format;

        data = MiniCart.hooks.trigger("alter_cart_data", data, this);

        Behaviors.content_removal(this.$elem.children());
        this.$elem.html(AjaxCart.cart(data));
        Behaviors.content_ready(this.$elem.children());

        this.indicate_update_complete();
    }

    /**
     * Update the minicart with an error (such as load failure).
     */
    MiniCart.prototype.update_cart_error = function(error) {
        Behaviors.content_removal(this.$elem.children());
        this.$elem.html(AjaxCart.cart_error({
            "friendly_error": this.friendly_error,
            "error_message": error
        }));
        Behaviors.content_ready(this.$elem.children());

        this.indicate_update_complete();
    }

    /**
     * Mark the minicart as loading.
     */
    MiniCart.prototype.indicate_update = function() {
        this.$elem.addClass("is-AjaxCart--updating");
    }

    /**
     * Mark the minicart as no longer loading.
     */
    MiniCart.prototype.indicate_update_complete = function() {
        this.$elem.removeClass("is-AjaxCart--updating");
    }
    
    Behaviors.register_behavior(MiniCart);

    /**
     * Broadcaster factory that produces a function that calls a method on all
     * instances of a given behavior.
     * 
     * Intended to be used to funnel Shopify API event handlers to individual
     * behavior instances.
     * 
     * @param {*} Class The behavior to locate.
     * @param {*} method The behavior method to call.
     * @returns A broadcaster that calls all behaviors with the given method
     * name.
     */
    function broadcaster(Class, method) {
        return function () {
            var i, carts = Class.find_markup($(document));
    
            for (i = 0; i < carts.length; i += 1) {
                carts[i][method].apply(carts[i], arguments);
            }
        };
    }
    
    Shopify.onCartUpdate = broadcaster(MiniCart, "cart_update_intent");
    Shopify.onItemAdded = broadcaster(MiniCart, "item_added_intent");
    
    return MiniCart;
}(window.SpaceStation.AjaxCart,
    window.jQuery,
    window.Behaviors,
    window.betteroffcanvas,
    window.Shopify));