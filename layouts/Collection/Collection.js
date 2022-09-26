(window.SpaceStation.Collection = function (Collection, $, betteroffcanvas, Behaviors) {
    "use strict";
    var cbk = function(){};

    /**
     * Behavior that latches onto quick-view toggle links.
     * 
     * Most of the heavy lifting of this is handled by betteroffcanvas: ergo,
     * each QuickView should also be a valid offcanvas toggle whose target is
     * some kind of modal. The content of that modal will be replaced with the
     * quickview page.
     */
    function QuickView() {
        Behaviors.init(QuickView, this, arguments);

        this.quickview_url = this.$elem.data("quickview");
        this.$modal = $(this.$elem.data("target"));
        this.$content = this.$modal.find("[data-quickview-content]");

        if (this.$content.length > 0) {
            this.$modal.on("offcanvas-open", this.modal_open_intent.bind(this));
            this.$modal.on("offcanvas-dismiss", this.modal_close_intent.bind(this));
        }
    }

    Behaviors.inherit(QuickView, Behaviors.Behavior);

    QuickView.QUERY = "[data-quickview]";

    /**
     * Event handler fired when the associated modal is opened.
     * 
     * @param {Object} evt An offcanvas-open event.
     */
    QuickView.prototype.modal_open_intent = function (evt) {
        if (!evt.originalEvent.toggle.is(this.$elem)) {
            return;
        }

        Behaviors.content_removal(this.$content.children());
        this.$content.children().remove();
        
        $.ajax({
            url: this.quickview_url,
            dataType: "html"
        }).done(function (data, textStatus, jqXHR) {
            this.$content.append($(data));
            this.$content.find("#admin_bar_iframe").remove();
            Behaviors.content_ready(this.$content.children());

            cbk(this.$modal, this.$content);
        }.bind(this)).error(function (jqXHR, textStatus, errorThrown) {
            Shopify.onError(jqXHR, textStatus);
        }.bind(this));
    }

    /**
     * Event handler fired with the associated modal is dismissed.
     * 
     * @param {Object} evt An offcanvas-dismiss event.
     */
    QuickView.prototype.modal_close_intent = function (evt) {
        if (!evt.originalEvent.target.is(this.$modal)) {
            return;
        }

        Behaviors.content_removal(this.$content.children());
        this.$content.children().remove();
    }

    Behaviors.register_behavior(QuickView);

    /**
     * Hook the opening of new quickviews.
     * 
     * @param {Function} newcbk The callback to call.
     * 
     * This function will always be called with a jQuery object of the modal
     * that was opened, and a jQuery holding the content element that had the
     * product's data shoved into it.
     */
    function setCallback(newcbk) {
        cbk = newcbk;
    }

    Collection.setCallback = setCallback;
    Collection.QuickView = QuickView;
    
    return Collection;
}(window.SpaceStation.Collection || {},
    window.jQuery,
    window.betteroffcanvas,
    window.Behaviors));