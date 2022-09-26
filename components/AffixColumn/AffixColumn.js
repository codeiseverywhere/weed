/*global define, console, document, window*/
/*jslint continue:true*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("AffixColumn", ["jquery", "Behaviors"], factory);
    } else {
        root.AffixColumn = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};
    
    function $do(that, target) {
        return function () {
            target.apply(that, arguments);
        };
    }
    
    /* An Affix root is an element which is used to determine the edges of the
     * region that columns stick to. It also provides the core event handlers
     * to drive the AffixColumn and AffixRow behaviors.
     */
    function Affix(elem, scrollElem) {
        Behaviors.init(Affix, this, arguments);

        this.height = this.$elem.height();
        this.offsetTop = this.$elem.offset().top;
        
        this.columns = [];
        this.$scrollElem = $(scrollElem || document);
        this.$scrollHeightElem = this.$scrollElem;
        
        //weird DOM quirk
        if (this.$scrollElem[0] === document) {
            this.$scrollHeightElem = $(window);
        }
        
        this.$alwaysTopElem = $(this.$elem.data("affixcolumn-alwaystop"));
        this.$alwaysBottomElem = $(this.$elem.data("affixcolumn-alwaysbottom"));
        
        this.bind_event_handlers();
        this.find_columns_and_rows();
        
        this.resized();
        this.scroll_changed();
    }
    
    Behaviors.inherit(Affix, Behaviors.Behavior);
    
    Affix.QUERY = "[data-affixcolumn='root']";
    
    Affix.prototype.deinitialize = function () {
        this.unbind_event_handlers();
    };
    
    /* Check our alwaystop/alwaysbottom elements and see if they are floating.
     * If so, add their height to the top and bottom adjustments given to the
     * individual columns.
     */
    Affix.prototype.determine_global_floating_adjustment = function () {
        this.globalTopAdjust = 0;
        
        this.$alwaysTopElem.each(function (index, atelem) {
            var $atelem = $(atelem);
            this.globalTopAdjust += $atelem.height();
        }.bind(this));
        
        this.globalBottomAdjust = 0;
        
        this.$alwaysBottomElem.each(function (index, atelem) {
            var $atelem = $(atelem);
            this.globalBottomAdjust += $atelem.height();
        }.bind(this));
    };

    Affix.prototype.resized = function () {
        var i, maxColHeight = 0, maxColId, heightSum, disp = 0, topAdjust = 0, bottomAdjust = 0;
        
        this.determine_global_floating_adjustment();
        this.height = this.$elem.height();
        
        if (this.columns.length > 0) {
            //Scan top rows to fix their displacement heights and determine top
            //adjustments.
            for (i = 0; i < this.columns.length; i += 1) {
                //Also, kill floating adjustments plz
                this.columns[i].clear_floating_adjustments();
                
                if (!this.columns[i].has_option("top")) {
                    continue;
                }
                
                //Top rows never get a bottom adjustment.
                this.columns[i].set_floating_adjustments(this.globalTopAdjust, topAdjust, 0, 0);
                
                disp = this.columns[i].displacement_height();
                
                this.columns[i].$height_bearing_element().css("min-height", disp + "px");
                topAdjust += disp;
            }
            
            //Scan bottom rows to fix their displacement heights and determine top
            //adjustments. This is done in reverse order so that the bottommost
            //bottom row gets the lowest bottom float adjustment.
            for (i = this.columns.length - 1; i >= 0; i -= 1) {
                if (!this.columns[i].has_option("bottom")) {
                    continue;
                }
                
                //Bottom rows never get a top adjustment.
                this.columns[i].set_floating_adjustments(0, 0, this.globalBottomAdjust, bottomAdjust);
                
                disp = this.columns[i].displacement_height();
                
                this.columns[i].$height_bearing_element().css("min-height", disp + "px");
                bottomAdjust += disp;
            }
            
            //Scan columns to select the height-bearing column.
            for (i = 0; i < this.columns.length; i += 1) {
                if (!this.columns[i].has_option("column")) {
                    continue;
                }
                
                //Columns get both the top and bottom adjustment.
                this.columns[i].set_floating_adjustments(this.globalTopAdjust, topAdjust, this.globalBottomAdjust, bottomAdjust);
                
                //Determine which column is height bearing for this Affix.
                if (maxColHeight < this.columns[i].displacement_height() &&
                        !this.columns[i].has_option("noheightbearing")) {
                    maxColHeight = this.columns[i].displacement_height();
                    maxColId = i;
                }
                
                this.columns[i].remove_state("tallest");
            }
            
            if (maxColId !== undefined) {
                this.columns[maxColId].add_state("tallest");
            }
        }
    };
    
    Affix.prototype.scroll_changed = function () {
        var i, maxColHeight = 0, maxColId;
        
        this.height = this.$elem.height();
        this.windowHeight = this.$scrollHeightElem.height();
        this.offsetTop = this.$elem.offset().top;
        this.scrollTop = this.$scrollElem.scrollTop();
        this.offsetBottom = this.offsetTop + this.height;
        this.scrollBottom = this.scrollTop + this.windowHeight;
        
        if (this.columns.length > 0) {
            for (i = 0; i < this.columns.length; i += 1) {
                this.columns[i].viewport_changed(this.height, this.offsetTop, this.offsetBottom, this.scrollTop, this.scrollBottom);
            }
        }
    };
    
    Affix.prototype.unbind_event_handlers = function () {
        if (this.scroll_handler !== undefined) {
            this.$scrollElem.off("scroll", this.scroll_handler);
        }
        
        if (this.resize_handler !== undefined) {
            $(window).off("resize", this.resize_handler);
        }
    };
    
    Affix.prototype.bind_event_handlers = function () {
        this.unbind_event_handlers();
        
        this.scroll_handler = $do(this, this.scroll_changed);
        this.resize_handler = $do(this, this.resized);
        
        this.$scrollElem.on("scroll", this.scroll_handler);
        $(window).on("resize", this.resize_handler);
        $(document).on("load", this.resize_handler);
        $("img").on("load", this.resize_handler);
    };
    
    Affix.prototype.find_columns_and_rows = function () {
        var $likely_columns = this.$elem.find(AffixColumn.QUERY),
            $likely_roots = this.$elem.find(Affix.QUERY);

        this.columns = [];
        this.roots = [];

        $likely_columns.each(function (index, lcelem) {
            var $lcelem = $(lcelem),
                $parent_root = $lcelem.parents().filter(Affix.QUERY).first();

            if ($parent_root[0] === this.$elem) {
                this.columns.push(AffixColumn.locate($lcelem));
            }
        }.bind(this));

        $likely_roots.each(function (index, lrelem) {
            var $lrelem = $(lrelem),
                $parent_root = $lrelem.parents().filter(Affix.QUERY).first();

            if ($parent_root[0] === this.$elem) {
                this.roots.push(Affix.locate($lrelem));
            }
        }.bind(this));
    };
    
    /* An AffixColumn is a normally fixed element which sticks to the top or
     * bottom edges of a scrolling viewport (typically the document).
     * 
     * AffixColumn itself contains no event handlers. The parent Affix is
     * responsible for propagating viewport scrolling to it's child Columns.
     * 
     * Options may be provided which cause the Column to behave differently.
     * Examples of this include the "noheightbearing" option, which prevents
     * your AffixColumn from being marked as tallest for the purposes of parent
     * element height preservation. See the parse_option_list function for more
     * information on the option list format, and has_option for what options
     * are available.
     * 
     * The name "AffixColumn" is a misnomer. "Columns" may be configured as rows
     * or columns in CSS. Orientation of the Column is configured with the
     * column/top/bottom options. If neither is active, "column" is assumed.
     */
    function AffixColumn(elem) {
        this.$elem = $(elem);
        this.options = this.parse_option_list(this.$elem.data("affixcolumn-options"));
        
        this.top_adjust = 0;
        this.bottom_adjust = 0;
    }
    
    Behaviors.inherit(AffixColumn, Behaviors.Behavior);
    
    AffixColumn.QUERY = "[data-affixcolumn='column']";
    
    /* Calculate the height taken up by the AffixColumn if placed in normal
     * document flow.
     * 
     * The floating adjustments currently applied to the column may cause
     * invalid displacement height results to occur. For best results, call
     * clear_floating_adjustments to remove them, and then trigger a viewport
     * update from the Affix root once the height has been measured.
     */
    AffixColumn.prototype.displacement_height = function () {
        return this.$elem.height();
    };
    
    /* Change the top/bottom values that this column floats at.
     * 
     * Floating adjustments determine the safe area of space that this element
     * may float at without being overlapped or overlapping top or bottom rows.
     * 
     * These will override any top/bottom values set via CSS.
     */
    AffixColumn.prototype.set_floating_adjustments = function (globalTop, top, globalBottom, bottom) {
        this.top_adjust = top;
        this.bottom_adjust = bottom;
        
        this.global_top_adjust = globalTop;
        this.global_bottom_adjust = globalBottom;
    };
    
    /* Remove inline CSS applied to make floating adjustments visually present.
     * 
     * You must call this method before querying displacement_height, or you
     * will get invalid results. After calling this method, you must trigger a
     * viewport update by calling scroll_changed on the containing Affix root.
     */
    AffixColumn.prototype.clear_floating_adjustments = function () {
        this.$elem.css("top", "");
        this.$elem.css("bottom", "");
    };
    
    /* Return the element responsible for propagating our displacement height in
     * normal document flow.
     * 
     * By default, the height bearing element is our parent element. We do not
     * have a facility to override this currently.
     */
    AffixColumn.prototype.$height_bearing_element = function () {
        return this.$elem.parent();
    };
    
    AffixColumn.prototype.add_state = function (state) {
        this.$elem.addClass("is-AffixColumn--" + state);
    };
    
    AffixColumn.prototype.remove_state = function (state) {
        this.$elem.removeClass("is-AffixColumn--" + state);
    };
    
    /* Determine if an AffixColumn option applies given the current viewport.
     * 
     * Valid options include:
     * 
     *  - column: AffixColumn to be oriented vertically aside other columns.
     *    The tallest column is marked as "tallest" and considered the height
     *    bearing column, whereby it is expected to be positioned in normal
     *    document flow such that the Affix element can grab it's CSS height.
     * 
     *  - top: AffixColumn to be oriented above other columns. Top rows are
     *    given a CSS min-height equal to the sum of their childrens' heights
     *    and their children are assumed to float. This minimum height will be
     *    applied as the top value to any following tops or columns.
     *
     *  - bottom: AffixColumn to be oriented below other columns. Bottom rows
     *    are given a CSS min-height in the same fashion as top rows. This
     *    minimum height will be applied as the bottom value to any preceding
     *    bottoms or columns.
     * 
     *  - noheightbearing: Column-oriented AffixColumn to be disqualified from
     *    being marked as a height-bearing column.
     */
    AffixColumn.prototype.has_option = function (option_string) {
        var i;
        
        for (i = 0; i < this.options.length; i += 1) {
            if (this.options[i].media === null || window.matchMedia(this.options[i].media).matches) {
                //Column enabled by default
                if (option_string === "column" &&
                        this.options[i].options.indexOf("top") === -1 &&
                        this.options[i].options.indexOf("bottom") === -1) {
                    return true;
                }
                
                return this.options[i].options.indexOf(option_string) > -1;
            }
        }
        
        if (option_string === "column") {
            return true;
        } else {
            return false;
        }
    };
    
    AffixColumn.MATCH_MEDIA_QUERY_REGEX = /\(([\s\S]*)\)/g;
    
    /* Parse an option list.
     * 
     * The option list determines what options are active on a column. It is
     * comma separated. Each comma indicates a new option list for a particular
     * media query. The first media query to match determines the total option
     * set. The final option set may or may not have a media query; if it does
     * not, then it serves as the default option set.
     * 
     * This is very analagous to the sizes attribute of <img> tags in modern
     * browsers. Example format:
     * 
     *    (min-width: 450px) column noheightbearing, top
     */
    AffixColumn.prototype.parse_option_list = function (option_list_string) {
        var cases, i, j, rval = [], case_obj = {}, match;
        
        if (option_list_string === undefined) {
            option_list_string = "";
        }
        
        cases = option_list_string.split(",");
        
        for (i = 0; i < cases.length; i += 1) {
            case_obj = {};
            match = this.constructor.MATCH_MEDIA_QUERY_REGEX.exec(cases[i]);
            
            //Reset the string. Sharing regex objects is dirty...
            this.constructor.MATCH_MEDIA_QUERY_REGEX.lastIndex = 0;
            
            if (match === null || match.length === 0) {
                case_obj.options = cases[i].split(" ");
                case_obj.media = null;
            } else {
                case_obj.options = cases[i].slice(match[0]).split(" ");
                case_obj.media = match[0];
            }
            
            //Filter empty options
            for (j = 0; j < case_obj.options.length; j += 0) {
                if (case_obj.options[j] === "") {
                    case_obj.options.splice(j, 1);
                } else {
                    j += 1;
                }
            }
            
            rval.push(case_obj);
        }
        
        return rval;
    };
    
    /* Internal method used by Affix to communicate to it's children the new
     * parameters of the scroll viewport.
     */
    AffixColumn.prototype.viewport_changed = function (rootHeight, offsetTop, offsetBottom, scrollTop, scrollBottom) {
        var isTopAnchored = this.has_option("column") || this.has_option("top"),
            isBottomAnchored = this.has_option("anchorbottom") || this.has_option("bottom"),
            bottomStateAdjust = true,
            topStateAdjust = true,
            adjustWithoutGlobal = true;
        
        //Remove existing floating adjustments.
        //Otherwise, our displacement height is incorrect.
        this.clear_floating_adjustments();
        
        //Apply affix states.
        if (isTopAnchored && scrollTop + this.global_top_adjust < offsetTop ||
                isBottomAnchored && scrollBottom - this.displacement_height() < offsetTop) {
            this.add_state("top");
            this.remove_state("bottom");
            bottomStateAdjust = false;
        } else if (isTopAnchored && scrollTop + this.top_adjust + this.global_top_adjust + this.displacement_height() + this.bottom_adjust >= offsetBottom ||
                isBottomAnchored && scrollBottom >= offsetBottom) {
            this.remove_state("top");
            this.add_state("bottom");
            topStateAdjust = false;
        } else {
            this.remove_state("top");
            this.remove_state("bottom");
            adjustWithoutGlobal = false;
        }
        
        //Apply floating adjustments.
        if ((this.has_option("column") || this.has_option("top")) && topStateAdjust) {
            if (adjustWithoutGlobal) {
                this.$elem.css("top", this.top_adjust + "px");
            } else {
                this.$elem.css("top", this.top_adjust + this.global_top_adjust + "px");
            }
        }
        
        if ((this.has_option("column") || this.has_option("bottom")) && bottomStateAdjust) {
            if (adjustWithoutGlobal) {
                this.$elem.css("bottom", this.bottom_adjust + "px");
            } else {
                this.$elem.css("bottom", this.bottom_adjust + this.global_bottom_adjust + "px");
            }
        }
    };
    
    Behaviors.register_behavior(Affix);

    module.Affix = Affix;
    module.AffixColumn = AffixColumn;

    return module;
}));
