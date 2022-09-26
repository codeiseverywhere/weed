/* Example UMD module.
 * Please remove comments before use.
 */

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        /* Define your code as an AMD module.
         *
         * The first parameter to define is the name of the module.
         * Make sure to provide something meaningful.
         *
         * The second parameter is an array listing the module dependencies. The
         * factory function down below will not execute until those dependencies
         * are ready, and it will be given those dependencies as arguments. For
         * example, placing "jquery" in this array will give you jQuery.
         *
         */
        define("module_name", [], factory);
    } else {
        /* The AMD define function is missing, so we must instead use global
         * variables. The factory function is called immediately, with any
         * dependencies manually pulled from the root object.
         *
         * For example, if your module requires jQuery, you would need to call
         * it like so:
         *
         *     factory(root.jQuery);
         *
         * Please note that all global variables are referred to through the
         * root object. If you are used to just typing "jQuery" elsewhere, then
         * the equivalent within this function is root.jQuery.
         *
         * Finally, we store the returned module in the root object - this will
         * create a global variable that other code can use. Make sure to change
         * the name of the stored variable to match the module name given in the
         * AMD case above.
         */
        root.module_name = factory();
    }
    /* Also make sure to have named arguments in your function in the same
     * order as what you put in your AMD dependencies or globals call.
     */
}(this, function () {
    "use strict";

    var module = {};

    /* Your code goes here.
     *
     * This is known as the factory function. It takes as parameters your
     * dependencies. Make sure that your argument names, the AMD definition,
     * and the non-AMD defintion lines above all agree, or you're gonna have a
     * bad time.
     *
     * If you wish to export code for other modules to use, please return a
     * suitable object or function. This returned value will become a global
     * variable named after your module on non-AMD pages and will be processed
     * by the AMD machinery on AMD pages.
     */

    return module;
}));
