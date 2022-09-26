(window.SpaceStation.AjaxCart.AddToCartForm = function(AjaxCart, $, Behaviors, Shopify) {
    "use strict";

    /**
     * Find if a particular behavior has instances or not.
     * 
     * @param {*} Class The behavior to check.
     * @returns Whether or not the class has instances.
     */
    function has_instances(Class) {
        var carts = Class.find_markup($(document));
        
        return carts.length > 0;
    }

    /**
     * Behavior that attaches itself to all add-to-cart forms, submits the form
     * via AJAX, and then triggers an AJAX Cart update.
     */
    function AddToCartForm() {
        Behaviors.init(AddToCartForm, this, arguments);

        this.$elem.on("submit", this.submit_intent.bind(this));
    }

    Behaviors.inherit(AddToCartForm, Behaviors.Behavior);

    AddToCartForm.QUERY = "form[action^='/cart/add']";

    /**
     * Event handler for when the form is submitted.
     */
    AddToCartForm.prototype.submit_intent = function(evt) {
        var action = this.$elem.attr("action"),
            method = this.$elem.attr("method"),
            formdata = new FormData(this.$elem[0]);
        
        if (!has_instances(AjaxCart.MiniCart)) {
            return;
        }
        
        evt.preventDefault();

        $.ajax({
            url: "/cart/add.js",
            type: method.toUpperCase(),
            data: formdata,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                Shopify.onItemAdded(data);
            }.bind(this),
            error: function(jqXHR, textStatus, errorThrown) {
                Shopify.onError(jqXHR, textStatus);
            }.bind(this),
        });
    };

    Behaviors.register_behavior(AddToCartForm);
    
    return AddToCartForm;
}(window.SpaceStation.AjaxCart || {},
    window.jQuery,
    window.Behaviors,
    window.Shopify));