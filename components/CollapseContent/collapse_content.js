/*global define, console, document, window*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("CollapseContent", ["jquery", "Behaviors"], factory);
    } else {
        root.CollapseContent = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};

    function $do(that, target) {
        return function () {
            target.apply(that, arguments);
        };
    }

    function CollapseContentRegion(elem) {
        Behaviors.init(CollapseContentRegion, this, arguments);

        this.$elem = $(elem);
        this.visible = this.$elem.data("collapsecontent-region-visible") !== undefined;

        this.update_classes();
    }

    Behaviors.inherit(CollapseContentRegion, Behaviors.Behavior);

    CollapseContentRegion.QUERY = "[data-collapsecontent-region]";

    CollapseContentRegion.prototype.update_classes = function () {
        this.$elem.find("[data-collapsecontent-body]").each(function (index, body_elem) {
            if (this.visible) {
                $(body_elem).addClass("is-CollapseContent--visible");
                $(body_elem).removeClass("is-CollapseContent--hidden");
            } else {
                $(body_elem).removeClass("is-CollapseContent--visible");
                $(body_elem).addClass("is-CollapseContent--hidden");
            }
        }.bind(this));

        this.$elem.find("[data-collapsecontent-trigger]").each(function (index, trigger_elem) {
            if (this.visible) {
                $(trigger_elem).addClass("is-CollapseContent--visible");
                $(trigger_elem).removeClass("is-CollapseContent--hidden");
            } else {
                $(trigger_elem).removeClass("is-CollapseContent--visible");
                $(trigger_elem).addClass("is-CollapseContent--hidden");
            }
        }.bind(this));
    };

    CollapseContentRegion.prototype.make_visible = function () {
        this.visible = true;
        this.update_classes();
    };

    CollapseContentRegion.prototype.make_hidden = function () {
        this.visible = false;
        this.update_classes();
    };

    CollapseContentRegion.prototype.toggle = function () {
        this.visible = !this.visible;
        this.update_classes();

        // Fire custom event when toggles are activated
        newEvent = new $.Event({
            "type": "collapsecontent-toggle",
            "visible": this.visible,
            "target": this.$elem,
        });

        this.$elem.trigger(newEvent);
    };

    function CollapseContentTrigger(elem) {
        Behaviors.init(CollapseContentTrigger, this, arguments);

        this.$elem = $(elem);

        if (this.$elem.data("collapsecontent-trigger") !== undefined) {
            //Mode 1: Trigger explicitly specifies region to toggle.
            this.region = this.set_region($(this.$elem.data("collapsecontent-trigger"))[0]);
        } else if (this.$elem.attr("href") !== undefined) {
            //Mode 1: Trigger explicitly specifies region to toggle, as an href..
            this.region = this.set_region($(this.$elem.data("collapsecontent-trigger"))[0]);
        }

        if (this.region === undefined) {
            //Mode 2: Find parent element that qualifies as a region.
            this.region = this.set_region(this.$elem.parents().filter(CollapseContentRegion.QUERY)[0]);
        }

        if (this.region === undefined) {
            console.error("There is a CollapseContent trigger that neither points to a valid region nor is a child of a valid region..");
        }

        this.$elem.on("click", this.toggle_intent.bind(this));
    }

    Behaviors.inherit(CollapseContentTrigger, Behaviors.Behavior);

    CollapseContentTrigger.QUERY = "[data-collapsecontent-trigger]";

    CollapseContentTrigger.prototype.set_region = function (elem) {
        if (elem === undefined) {
            return;
        }

        return CollapseContentRegion.locate(elem);
    };

    CollapseContentTrigger.prototype.toggle_intent = function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        
        this.region.toggle();
    };

    Behaviors.register_behavior(CollapseContentRegion);
    Behaviors.register_behavior(CollapseContentTrigger);

    module.CollapseContentRegion = CollapseContentRegion;
    module.CollapseContentTrigger = CollapseContentTrigger;

    return module;
}));
