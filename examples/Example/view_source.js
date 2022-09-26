(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("ViewSource", ["jquery", "Behaviors"], factory);
    } else {
        root.ViewSource = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";
    
    var module = {};
    
    /* A specimen is a living example of a particular component or group of
     * components that we want to display source code for.
     */
    function Specimen() {
        Behaviors.init(Specimen, this, arguments);
    }
    
    Behaviors.inherit(Specimen, Behaviors.Behavior);
    
    Specimen.QUERY = "[data-specimen]";
    
    /* Retrieve the HTML source for ourselves.
     */
    Specimen.prototype.innerhtml = function () {
        return this.$elem.html();
    };
    
    Specimen.prototype.update_css_classes = function () {
        if (this.hidden) {
            this.$elem.addClass("is-Example-specimen--hidden");
            this.$elem.removeClass("is-Example-specimen--visible");
        } else {
            this.$elem.removeClass("is-Example-specimen--hidden");
            this.$elem.addClass("is-Example-specimen--visible");
        }
    };
    
    Specimen.prototype.hide = function () {
        this.hidden = true;
        this.update_css_classes();
    };
    
    Specimen.prototype.show = function () {
        this.hidden = false;
        this.update_css_classes();
    };
    
    /* The target element which displays the HTML source for a specimen.
     */
    function SpecimenSource() {
        Behaviors.init(SpecimenSource, this, arguments);
        
        this.hidden = true;
    }
    
    Behaviors.inherit(SpecimenSource, Behaviors.Behavior);
    
    SpecimenSource.QUERY = "[data-specimen-source]";
    
    /* Add formatted HTML source as text to the source region.
     */
    SpecimenSource.prototype.set_source = function (html_src) {
        this.$elem.text(html_src);
    };
    
    SpecimenSource.prototype.update_css_classes = function () {
        if (this.hidden) {
            this.$elem.addClass("is-Example-specimen_source--hidden");
            this.$elem.removeClass("is-Example-specimen_source--visible");
        } else {
            this.$elem.removeClass("is-Example-specimen_source--hidden");
            this.$elem.addClass("is-Example-specimen_source--visible");
        }
    };
    
    SpecimenSource.prototype.hide = function () {
        this.hidden = true;
        this.update_css_classes();
    };
    
    SpecimenSource.prototype.show = function () {
        this.hidden = false;
        this.update_css_classes();
    };
    
    /* Button which actually toggles between the specimen and the 
     */
    function SpecimenToggle() {
        Behaviors.init(SpecimenToggle, this, arguments);
        
        this.specimen_id = this.$elem.data("specimen-toggle");
        
        this.specimen = Specimen.locate($("#" + this.specimen_id));
        this.specimen_source = SpecimenSource.locate($("[data-specimen-source='" + this.specimen_id + "']"));
        
        this.$elem.on("click", this.source_toggle_intent.bind(this));
        
        this.visible_side = "specimen";
    }
    
    Behaviors.inherit(SpecimenToggle, Behaviors.Behavior);
    
    SpecimenToggle.QUERY = "[data-specimen-toggle]";
    
    SpecimenToggle.prototype.source_toggle_intent = function (evt) {
        evt.preventDefault();
        
        if (this.visible_side === "specimen") {
            this.specimen.hide();
            this.specimen_source.set_source(this.specimen.innerhtml());
            this.specimen_source.show();
            
            this.visible_side = "source";
        } else {
            this.specimen_source.hide();
            this.specimen.show();
            
            this.visible_side = "specimen";
        }
    };
    
    Behaviors.register_behavior(Specimen);
    Behaviors.register_behavior(SpecimenSource);
    Behaviors.register_behavior(SpecimenToggle);
    
    module.Specimen = Specimen;
    module.SpecimenSource = SpecimenSource;
    module.SpecimenToggle = SpecimenToggle;
    
    return module;
}));
