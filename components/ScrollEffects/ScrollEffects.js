/*global define, console*/

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("ScrollEffects", ["jquery", "Behaviors"], factory);
    } else {
        root.ScrollEffects = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};

    function ScrollEffects(elem) {
        Behaviors.init(ScrollEffects, this, arguments);

        this.$elem = $(elem);
        this.$scrollCtxt = $(window); //TODO: Allow CSS overflow scrolling
        
        this.scrollHandler = this.on_scroll_intent.bind(this);

        this.$scrollCtxt.on("scroll", this.scrollHandler);
    }

    Behaviors.inherit(ScrollEffects, Behaviors.Behavior);

    ScrollEffects.QUERY = "[data-scrolleffects]";
    ScrollEffects.THROTTLE_TIMEOUT = 200;
    
    /* Deinitialize our scroll handler if needed.
     */
    ScrollEffects.prototype.deinitialize = function () {
        this.$scrollCtxt.off("scroll", this.scrollHandler);
    };
    
    /* Return a list of all available scroll effect modes on this bit.
     */
    ScrollEffects.prototype.activation_modes = function () {
        return this.$elem.data("scrolleffects").split(" ");
    };

    ScrollEffects.prototype.update_css_classes = function () {
        var activation_modes = this.activation_modes(),
            active = false;

        if (this.isTopVisible && activation_modes.indexOf("top_visible") !== -1) {
            active = true;
        }

        if (this.isBottomVisible && activation_modes.indexOf("bottom_visible") !== -1) {
            active = true;
        }

        if (this.isVisible && activation_modes.indexOf("visible") !== -1) {
            active = true;
        }

        if (this.onceTopVisible && activation_modes.indexOf("top_visible_once") !== -1) {
            active = true;
        }

        if (this.onceBottomVisible && activation_modes.indexOf("bottom_visible_once") !== -1) {
            active = true;
        }

        if (this.onceVisible && activation_modes.indexOf("visible_once") !== -1) {
            active = true;
        }

        if (active) {
            this.$elem.addClass("is-ScrollEffects--active");
            this.$elem.removeClass("is-ScrollEffects--inactive");
        } else {
            this.$elem.removeClass("is-ScrollEffects--active");
            this.$elem.addClass("is-ScrollEffects--inactive");
        }
    };

    ScrollEffects.prototype.on_scroll_intent = function () {
        var top = this.$elem.offset().top,
            height = this.$elem.height(),
            bottom = top + height,
            contextOffset = this.$scrollCtxt.offset(),
            contextScrollTop = contextOffset !== undefined
                                ? contextOffset.top + this.$scrollCtxt.scrollTop()
                                : this.$scrollCtxt.scrollTop(),
            contextHeight = this.$scrollCtxt.height(),
            contextScrollBottom = contextScrollTop + contextHeight;

        this.isTopVisible = contextScrollTop <= top && top <= contextScrollBottom;
        this.isBottomVisible = contextScrollTop <= bottom && bottom <= contextScrollBottom;
        this.isVisible = this.isTopVisible || this.isBottomVisible
            || (top <= contextScrollTop && contextScrollTop <= bottom)
            || (top <= contextScrollBottom && contextScrollBottom <= bottom);

        this.onceTopVisible = this.onceTopVisible || this.isTopVisible;
        this.onceBottomVisible = this.onceBottomVisible || this.isBottomVisible;
        this.onceVisible = this.onceVisible || this.isVisible;

        this.top = top;
        this.bottom = bottom;
        this.contextScrollTop = contextScrollTop;
        this.contextScrollBottom = contextScrollBottom;

        this.update_css_classes();
    };

    Behaviors.register_behavior(ScrollEffects);

    function ScrollAlax() {
        Behaviors.init(ScrollAlax, this, arguments);

        this.$layers = this.$elem.find("li");
        this.depth = this.$elem.height() * -0.5;

        if (this.$elem.data('scrollalax-depthrange') === 'outside') {
            this.anim_scale = 1;
        } else {
            this.anim_scale = -1;
        }

        this.weights = this.weight_layers(this.$layers);

        this.on_scroll_intent();
    }

    Behaviors.inherit(ScrollAlax, ScrollEffects);

    ScrollAlax.QUERY = "[data-scrollalax]";

    /* Determine the weights of each layer on the parallax group. */
    ScrollAlax.prototype.weight_layers = function ($layers) {
        var min = Infinity, max = -Infinity, w = [];

        $layers.each(function (index, elem) {
            var depth = $(elem).data("scrollalax-depth");

            if (min > depth) {
                min = depth;
            }

            if (max < depth) {
                max = depth;
            }
        }.bind(this));

        $layers.each(function (index, elem) {
            var depth = $(elem).data("scrollalax-depth");

            if (this.anim_scale === -1) {
                w.push(-1 + (depth - min) / (max - min));
            } else {
                w.push((depth - min) / (max - min));
            }
        }.bind(this));

        return w;
    }

    /* Calculate X or Y positions of a layer. */
    ScrollAlax.prototype.apply_transform_css = function(style, index, xPct, yPct) {
        var pct_Xdrag = this.weights[index] * xPct * this.anim_scale,
            pct_Ydrag = this.weights[index] * yPct * this.anim_scale,
            xDisp = this.depth * pct_Xdrag * this.anim_scale,
            yDisp = this.depth * pct_Ydrag * this.anim_scale;

        //style.left = xDisp + "px";
        //style.top = yDisp + "px";

        style.transform = "translate3D(" + xDisp + "px, " + yDisp + "px, 0px)";
    };

    /* Update the scroll animation. */
    ScrollAlax.prototype.update_css_classes = function (evt) {
        this.$layers.each(function (index, layer_elem) {
            var pct_down = Math.max(Math.min((this.contextScrollTop - this.top) / this.$elem.height(), 1.0), 0.0),
                $layer_elem = $(layer_elem);

            this.apply_transform_css(layer_elem.style, index, 0, pct_down);
        }.bind(this));
    };

    Behaviors.register_behavior(ScrollAlax);

    module.ScrollEffects = ScrollEffects;
    module.ScrollAlax = ScrollAlax;

    return module;
}));
