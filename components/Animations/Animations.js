/*global define, console, document, window*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("Animations", ["jquery", "Behaviors"], factory);
    } else {
        root.Animations = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";
    
    var module = {};

    /* Watches for the start and end of an animation.
     *
     * The .promise attribute stores a promise which resolves whenever the
     * animation has completed or no animation events were detected over a
     * timeout period of 5 second.
     *
     * An important caveat: Animations with delay longer than 5 seconds will
     * fail to fire events and the animation watcher will trigger the timeout
     * behavior instead. You can avoid this behavior by triggering another
     * animation of any kind during the timeout period and keeping it alive
     * until the delayed animation begins.
     */
    function AnimationWatcher($elem) {
        var Class = this.constructor,
            eventSelector = Class.get_unique_id(),
            that = this,
            evtStartNames = "animationstart." + eventSelector +
                      " webkitAnimationStart." + eventSelector +
                      " oanimationstart." + eventSelector +
                      " MSAnimationStart." + eventSelector,
            evtEndNames = "animationend." + eventSelector +
                      " webkitAnimationEnd." + eventSelector +
                      " oanimationend." + eventSelector +
                      " MSAnimationEnd." + eventSelector,
            animation_start = this.animation_start.bind(this),
            animation_end = this.animation_end.bind(this),
            animation_timeout_delay = 5000;

        this.eventSelector = eventSelector;

        this.$elem = $elem;
        this.$elem.on(evtStartNames, animation_start);
        this.$elem.on(evtEndNames, animation_end);

        if (window.Modernizr && window.Modernizr.cssanimations === false) {
            animation_timeout_delay = 0;
        }

        this.timeout = window.setTimeout(this.abort_animation.bind(this), animation_timeout_delay);
        this.remaining_animations = [];

        //We remove event handlers after one of the handlers resolves the
        //animation promise.
        this.promise = new Promise(function (resolve, reject) {
            that.resolve = resolve;
            that.reject = reject;
        }).then(function () {
            that.$elem.off(evtStartNames, animation_start);
            that.$elem.off(evtEndNames, animation_end);
        });

        console.log("ANIMATIONWATCHER" + this.eventSelector + ": Created");
    }

    AnimationWatcher.count = 0;

    AnimationWatcher.get_unique_id = function () {
        var Class = this,
            sel = "." + Class.name + "_" + Class.count;

        Class.count += 1;
        return sel;
    };

    AnimationWatcher.prototype.animation_start = function (evt) {
        console.log("ANIMATIONWATCHER" + this.eventSelector + ": Begun (" + evt.originalEvent.animationName + ")");
        if (this.timeout !== null) {
            window.clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.remaining_animations.push(evt.originalEvent.animationName);
    };

    AnimationWatcher.prototype.animation_end = function (evt) {
        var loc = this.remaining_animations.indexOf(evt.originalEvent.animationName);

        console.log("ANIMATIONWATCHER" + this.eventSelector + ": Ended (" + evt.originalEvent.animationName + ")");

        if (loc !== -1) {
            this.remaining_animations.splice(loc, 1);
        }

        if (this.remaining_animations.length === 0) {
            this.resolve();
        }
    };

    AnimationWatcher.prototype.abort_animation = function (evt) {
        console.log("ANIMATIONWATCHER" + this.eventSelector + ": Abort timeout triggered");

        if (this.remaining_animations.length === 0) {
            this.resolve();
        }
    };

    module.AnimationWatcher = AnimationWatcher;

    return module;
}));
