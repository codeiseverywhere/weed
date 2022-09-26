(window.Behaviors.Hooks = function(Behaviors, $) {
    "use strict";

    /**
     * Manages global hooks for behaviors.
     * 
     * A global hook is not tied to any specific instance of a behavior; unlike
     * events. You add hooks to your behavior by adding one as a property of
     * your class, defining it's hook types, and triggering them in your
     * behavior's methods. Third-party code can then hook into your class by
     * attaching to the class's global hooks mechanism.
     * 
     * Hooks are only to be used in cases where you don't particularly care
     * about *which* behavior you are talking to, only that you want to
     * intercept all of them. They are thus distinct from events, which are
     * fired on a specific behavior and can be used to link different, specific
     * behaviors.
     */
    function Hooks() {
        this.hooks = {};
    };

    /**
     * Define a hook name.
     * 
     * @param {string} hook_name The name of the hook to attach to.
     */
    Hooks.prototype.define_hook_type = function(hook_name) {
        if (!this.hooks.hasOwnProperty(hook_name)) {
            this.hooks[hook_name] = [];
        }
    }

    /**
     * An attached hook callback. Can optionally filter the hook's inherent
     * value.
     * 
     * @callback AttachedHook
     * @param {*} value The inherent hook value, which depends on which hook is
     * being attached.
     * 
     * May have already been filtered by a previously installed hook function.
     * 
     * @param {...*} context Any further context values.
     * 
     * These are always the hook's inherent values and cannot be filtered by
     * user code. By convention, the first context value is the hooked
     * Behavior instance.
     * 
     * @returns The filtered value.
     * 
     * Returning `undefined` (either explicitly, or by not having a `return`
     * statement in your function) indicates that your hook does not wish to
     * change the value.
     */

    /**
     * Attach to a particular named hook.
     * 
     * @param {string} hook_name The name of the hook to attach to.
     * @param {AttachedHook} impl The instance to be called at hook time.
     * @throws Error if the `hook_name` is invalid.
     */
    Hooks.prototype.attach = function(hook_name, impl) {
        this.hooks[hook_name].push(impl);
    }

    /**
     * Trigger a given named hook.
     * 
     * @param {string} hook_name The hook to trigger.
     * @param {*} value The hook value, which hook functions will be expected
     * to modify.
     * @param {Behaviors.Behavior} instance The current behavior being hooked.
     * @param {*} * 
     * @returns The hook value, optionally modified by any attached hooks.
     */
    Hooks.prototype.trigger = function(hook_name, value, instance) {
        var i, new_value, context = [value, instance];
        for (i = 3; i < arguments.length; i += 1) {
            context.push(arguments[i]);
        }

        for (i = 0; i < this.hooks[hook_name].length; i += 1) {
            new_value = this.hooks[hook_name][i].apply(this, context);
            if (new_value !== undefined) {
                context[0] = new_value;
            }
        }

        return context[0];
    }

    return Hooks;
}(window.Behaviors,
    window.jQuery));