/*global define, window, document*/

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("Behaviors", ["jquery"], factory);
    } else {
        root.Behaviors = factory(root.jQuery);
    }
}(this, function ($) {
    "use strict";

    var module = {},
        behavior_registry = {},
        content_ready_listeners = [],
        ElementMissingError = error("ElementMissingError");
    
    /* Throttle an event handler.
     *
     * Returns a function which, no matter how frequently it's called, will
     * only trigger a maximum of once per timeout period. More specifically,
     * the first event will always be processed, then, no events will process
     * until the end of the timeout period. If one or more events occurred
     * during this period, the last event recieved will trigger immediately
     * after the end of the timeout period, as well as restart the throttling
     * period. Any preceding events will be discarded.
     *
     * Not to be confused with a debounce, which only fires the event handler
     * at the end of a string of events spaced closer than the timeout period.
     *
     * The nature of this function means that any passed in function's return
     * value will be discarded.
     */
    function throttle_single(func, timeout) {
        var lastTimeout, afterLastArgs, afterLastThis;

        function unthrottle() {
            if (afterLastArgs !== undefined) {
                func.apply(afterLastThis, afterLastArgs);
                afterLastArgs = undefined;
                lastTimeout = window.setTimeout(unthrottle, timeout);
            } else {
                lastTimeout = undefined;
            }
        }

        return function () {
            var myThis = this, myArgs = [], i;

            for (i = 0; i < arguments.length; i += 1) {
                myArgs.push(arguments[i]);
            }

            if (lastTimeout === undefined) {
                func.apply(myThis, myArgs);
                lastTimeout = window.setTimeout(unthrottle, timeout);
            } else {
                afterLastArgs = myArgs;
                afterLastThis = myThis;
            }
        };
    }

    function Behavior(elem) {
        //Do something to elem
        this.$elem = $(elem);
    }

    /* Find a behavior's markup.
     *
     * The $context argument passed to this function is the jQuery element that
     * will be searched for behaviors. Any additional arguments will be passed
     * to Behavior.locate and ultimately to the behavior's constructor.
     */
    Behavior.find_markup = function ($context) {
        var results = [], i, splitArgs = [], Class = this;

        for (i = 1; i < arguments.length; i += 1) {
            splitArgs.push(arguments[i]);
        }
        
        function processElem(index, elem) {
            var locateArgs = [elem].concat(splitArgs);

            results.push(Class.locate.apply(Class, locateArgs));
        }
        
        $context.filter(Class.QUERY).each(processElem);
        $context.find(Class.QUERY).each(processElem);

        return results;
    };

    /* Locate a behavior onto an element, returning an instance of that
     * behavior that you can work with.
     *
     * A behavior locates onto an element by instantiating an instance of
     * itself and installing it onto the markup's jQuery data. Therefore, we
     * will only instantiate that behavior once; and further calls to .locate
     * instead return the same object. Thus, it is safe to use .locate as a
     * general accessor - it is idempotent.
     *
     * The elem argument indicates the element that the behavior should locate
     * onto. Further arguments are passed onto the constructor.
     *
     * TODO: Is there a non-jQuery way of handling this?
     */
    Behavior.locate = function (elem, ...objectArgs) {
        var $elem = $(elem), new_object, i, Class = this,
            rc = $elem.data("behaviors-registered-classes");
        
        if ($elem.length === 0) {
            throw new ElementMissingError("Attempted to locate a Behavior onto an empty element query.");
        }

        if (rc === undefined) {
            rc = {};
        }

        if (rc[Class.QUERY] === undefined) {
            rc[Class.QUERY] = new Class(elem, ...objectArgs);
        } else {
            new_object = rc[Class.QUERY];
        }

        $elem.data("behaviors-registered-classes", rc);

        return new_object;
    };

    /* Respond to the presence of new content on the page.
     *
     * By default, we attempt to find markup on all children of the context.
     * Subclasses may do something crazier, like say delay behavior processing
     * until some third-party API is loaded.
     *
     * Consider this roughly equivalent to $(document).ready() callbacks.
     */
    Behavior.content_ready = function ($context) {
        var Class = this;

        Class.find_markup($context);
    };
    
    /* Respond to the impending removal of content from the page.
     * 
     * Most behaviors that only attach event handlers to their own content are
     * safe and do not need to implement content removal support: they will
     * inherently "fall away".
     * 
     * However, behaviors that run a constant animation kernel or attach event
     * handlers to elements outside of their own ownership must provide a
     * mechanism to detach those event handlers and stop those kernels.
     */
    Behavior.content_removal = function ($context) {
        var Class = this,
            $attached_elems = $context.find(Class.QUERY);
        
        //Iterate through each element and see if our behavior has located upon
        //them. We don't just call .find_markup/.locate since we don't want to
        //risk initializing something just to tear it down one cycle later.
        $attached_elems.each(function (index, attach_elem) {
            var $elem = $(attach_elem),
                rc = $elem.data("behaviors-registered-classes");
            
            if (rc === undefined) {
                return;
            }
            
            if (rc[Class.QUERY] === undefined) {
                return;
            }
            
            if (rc[Class.QUERY].deinitialize === undefined) {
                return;
            }
            
            rc[Class.QUERY].deinitialize();
        });
    };

    /* Register a behavior so that it can respond to global events such as new
     * content becoming ready.
     *
     * It is not always appropriate to register your behavior to recieve load
     * events. Generally, if this is a behavior you would initialize yourself,
     * perhaps with special arguments, then you should not register that here.
     */
    function register_behavior(Class, name) {
        if (name === undefined) {
            name = Class.QUERY;
        }

        if (behavior_registry[name] === Class) {
            console.warn("Attempted to register the same behavior twice to the same CSS selector \"" + name + "\".");
            return;
        } else if (behavior_registry[name] !== undefined) {
            console.error("Attempted to register a second behavior onto CSS selector \""
                + name + "\". Only one behavior may be registered to a given CSS selector "
                + "at a given time. The offending classes are " + Class.name
                + " and " + behavior_registry[name].name + ".");
            
            return;
        }

        behavior_registry[name] = Class;
    }
    
    /* Register a function that is called when content is ready.
     * 
     * This function should only be used for things that are not a Behavior.
     * Proper behaviors should be registered using register_behavior for future
     * uses. Non-behavior listeners get registered here so that future uses of
     * behavior registration do not conflict with non-Behavior listeners.
     */
    function register_content_listener(func) {
        content_ready_listeners.push(func);
    }

    /* Indicate that some new content is ready.
     *
     * The given content will be passed onto all registered behaviors.
     *
     * CMS/frameworks with their own ready mechanism will need to ship their
     * own replacement/wrapper for this function that pushes calls to this
     * function over to that mechanism; and calls from that mechanism need to
     * come back here.
     */
    function content_ready($context) {
        var k, i;
        
        function do_later(obj, func) {
            window.setTimeout(func.bind(obj, $context), 0);
        }
        
        for (i = 0; i < content_ready_listeners.length; i += 1) {
            do_later(undefined, content_ready_listeners[i]);
        }

        for (k in behavior_registry) {
            if (behavior_registry.hasOwnProperty(k)) {
                do_later(behavior_registry[k], behavior_registry[k].content_ready);
            }
        }
    }
    
    /* Indicate that content is about to be removed.
     * 
     * Registered behaviors with destructors will be called upon to remove any
     * external event handlers or animation kernels preventing them from being
     * terminated by the JS runtime.
     * 
     * TODO: Add content_removal listener functions.
     */
    function content_removal($context) {
        var k, i;
        
        function do_later(obj, func) {
            window.setTimeout(func.bind(obj, $context), 0);
        }
        
        for (k in behavior_registry) {
            if (behavior_registry.hasOwnProperty(k)) {
                do_later(behavior_registry[k], behavior_registry[k].content_removal);
            }
        }
    }
    
    function error(error_class_name, ParentClass) {
        if (error_class_name === undefined) {
            throw new Error("Please name your error subclass.");
        }

        if (!(ParentClass instanceof Function)) {
            ParentClass = Error;
        }

        var SubError = function (message) {
            var err = new Error(message);
            err.name = error_class_name;

            this.name = error_class_name;
            this.message = err.message;
            if (err.stack) {
                this.stack = err.stack;
            }
        };

        SubError.prototype = new ParentClass("u dont c me");
        SubError.prototype.constructor = SubError;
        SubError.prototype.name = error_class_name;

        delete SubError.prototype.stack;

        return SubError;
    }
    
    function inherit(ChildClass, ParentClass) {
        var k;

        //Use the prototyping system to copy methods from parent to child.
        ChildClass.prototype = Object.create(ParentClass.prototype);
        ChildClass.prototype.constructor = ChildClass;
        ChildClass.prototype.parent = ParentClass.prototype;

        //Manually copy class-level methods from parent to child.
        for (k in ParentClass) {
            if (ParentClass.hasOwnProperty(k)) {
                ChildClass[k] = ParentClass[k];
            }
        }
    }

    function init(ChildClass, object, args) {
        ChildClass.prototype.parent.constructor.apply(object, args);
    }
    
    /* By default, report the initial page load to registered behaviors.
     */
    $(document).ready(function () {
        content_ready($(document));
    });
    
    module.ElementMissingError = ElementMissingError;
    module.throttle_single = throttle_single;
    module.Behavior = Behavior;
    module.error = error;
    module.inherit = inherit;
    module.init = init;
    module.register_behavior = register_behavior;
    module.content_ready = content_ready;
    module.content_removal = content_removal;
    module.register_content_listener = register_content_listener;

    return module;
}));
