(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("StaffGrid", ["jquery", "Behaviors"], factory);
    } else {
        root.StaffGrid = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};
    
    function StaffGridSlider() {
        Behaviors.init(StaffGridSlider, this, arguments);
        
        this.$elem.slick({
            prevArrow: this.$elem.find('[data-staffgrid-prev]'),
            nextArrow: this.$elem.find('[data-staffgrid-next]')
        });
    }
    
    Behaviors.inherit(StaffGridSlider, Behaviors.Behavior);
    
    StaffGridSlider.QUERY = "[data-staffgrid-slider]";
    
    StaffGridSlider.prototype.goto = function (id, animate) {
        this.$elem.slick('slickGoTo', id, animate);
    }
    
    function StaffGridModal() {
        Behaviors.init(StaffGridModal, this, arguments);
        
        this.slider = StaffGridSlider.locate(this.$elem.find('[data-staffgrid-slider]'));
        this.$elem.on("offcanvas-open", this.modal_reveal_intent.bind(this));
    }
    
    Behaviors.inherit(StaffGridModal, Behaviors.Behavior);
    
    StaffGridModal.QUERY = "[data-staffgrid-modal]";
    
    StaffGridModal.prototype.modal_reveal_intent = function (evt) {
        var slideIndex = $(evt.originalEvent.toggle).data('staffgrid-slider-index');
        
        this.slider.goto(slideIndex, true);
    };
    
    Behaviors.register_behavior(StaffGridModal);
    Behaviors.register_behavior(StaffGridSlider);
    
    module.StaffGridModal = StaffGridModal;
    module.StaffGridSlider = StaffGridSlider;
    
    return module;
}));
