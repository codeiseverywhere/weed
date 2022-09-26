/*global define, console, document, window, Promise*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("PageTransition", ["jquery", "Behaviors", "Animations"], factory);
    } else {
        root.PageTransition = factory(root.jQuery, root.Behaviors, root.Animations);
    }
}(this, function ($, Behaviors, Animations) {
    "use strict";

    var module = {};

    function $do(that, target) {
        return function () {
            target.apply(that, arguments);
        };
    }

    /* A page transition region is an element on the page with a unique ID that
     * is the same from page load to page load. It is a good idea for there to
     * be only one page transition region covering as much is it can on the
     * page.
     *
     * An ID is mandatory for page transition regions.
     */
    function PageTransitionRegion(elem) {
        Behaviors.init(PageTransitionRegion, this, arguments);

        this.id = this.$elem.attr("id");

        this.$elem.on("click", this.navigation_intent.bind(this));

        this.claim_current_state();
        $(window).on("popstate", this.pop_state_intent.bind(this));
    }

    Behaviors.inherit(PageTransitionRegion, Behaviors.Behavior);

    PageTransitionRegion.QUERY = "[data-pagetransition-region]";
    
    /* Determine if we can transition to a new page or not.
     * 
     * This does not actually replace the content. Thus, you can make the check
     * without committing to the new page.
     */
    PageTransitionRegion.prototype.can_replace = function ($new_document) {
        var $other_region = $new_document.find("#" + this.id);
        if ($other_region.length === 0) {
            $other_region = $new_document.filter("#" + this.id);
        }
        
        if ($other_region.length === 0) {
            return false;
        }
        
        return true;
    };
    
    /* Prepare to replace the old content with the new one.
     */
    PageTransitionRegion.prototype.prepare_to_replace = function ($old_document) {
        Behaviors.content_removal($old_document.children().filter(":not([data-pagetransition-backdrop])"));
    };

    /* Replace current content with content pulled from a new page we're trying
     * to transition into.
     *
     * Returns false if we could not extract content from the new document.
     * In this case, calling method should perform a traditional navigation to
     * the new document.
     */
    PageTransitionRegion.prototype.replace = function ($new_document) {
        var $other_region = $new_document.find("#" + this.id), $children;
        if ($other_region.length === 0) {
            $other_region = $new_document.filter("#" + this.id);
        }

        if ($other_region.length === 0) {
            return false;
        }
        
        $children = $other_region.children().filter(":not([data-pagetransition-backdrop])");

        this.$elem.children().filter(":not([data-pagetransition-backdrop])").remove();
        this.$elem.append($children);
        $(window).scrollTop(0);
        
        Behaviors.content_ready($children.parent());

        return true;
    };

    /* Replace the backdrop element.
     *
     * This is replaced separately so that each page can specify it's own outro
     * backdrop without interrupting the incoming animation.
     *
     * This should only be called after the promise returned by transition_in
     * resolves.
     *
     * Returns false if we could not extract content from the new document.
     * In this case, calling method should perform a traditional navigation to
     * the new document.
     */
    PageTransitionRegion.prototype.replace_backdrop = function ($new_document) {
        var $other_region = $new_document.find("#" + this.id);
        if ($other_region.length === 0) {
            $other_region = $new_document.filter("#" + this.id);
        }

        if ($other_region.length === 0) {
            return false;
        }

        this.$elem.attr("class", $other_region.attr("class"));
        this.$elem.children().filter("[data-pagetransition-backdrop]").remove();
        this.$elem.append($other_region.children().filter("[data-pagetransition-backdrop]"));

        return true;
    };

    /* Change the browser URL to point to the new URL, and also fix relative
     * links such that they resolve correctly.
     *
     * The transition property in the pushState data indicates that this entry
     * was placed here by the PageTransitionRegion class. This lets us avoid
     * applying transitions to things that shouldn't get them.
     */
    PageTransitionRegion.prototype.replace_state = function (url) {
        window.history.pushState({transition: true, url: url}, "", url);
        this.claim_current_state();
    };
    
    /* Changes the document head to match what is present in the new document.
     * 
     * Currently, only title replacement is supported, but this function may
     * also be extended to 
     */
    PageTransitionRegion.prototype.replace_head = function ($new_document) {
        var $new_title = $new_document.filter("title"),
            $title = $("title");
        
        if ($new_title.length === 0) {
            $new_title = $new_document.find("title");
        }
        
        $title.text($new_title.text());
    };
    
    /* Retrigger analytics scripts if so marked.
     */
    PageTransitionRegion.prototype.replace_analytics = function () {
        var $reloadable_tags;
        
        //Step 1: Find tags marked for reloading.
        $reloadable_tags = $(this.constructor.RELOADABLE_SCRIPT_QUERY);
        
        //Step 2: Reinsert them, hopefully causing them to be included again.
        //We need to try this two separate ways based on if it's an inline
        //script or external.
        $reloadable_tags.detach();
        
        $reloadable_tags.each(function (index, elem) {
            var $elem = $(elem), src = $elem.attr("src");
            
            if (src !== undefined) {
                //External script, recreate the tag
                $elem.remove();
                $elem = $("<script></script>");
                $elem.attr("src", src);
            }
            
            $("body").append($elem);
        });
    };
    
    /* Indicates an analytics tag that can be retriggered for the new page load
     * by just reloading it's tag.
     */
    PageTransitionRegion.RELOADABLE_SCRIPT_QUERY = "[data-pagetransition-analytics='reloadable']";

    /* Claim the current history state for ourselves.
     *
     * By default, this is only called at the start of the page load.
     */
    PageTransitionRegion.prototype.claim_current_state = function () {
        var url = window.location.href;
        window.history.replaceState({transition: true, url: url}, "", url);
    };

    /* Determine if link is internal or external.
     *
     * The purpose of distinguishing between internal and external links is to
     * check if we can transition to them properly or not. We can only
     * transition into pages with compatible regions; so we assume that all
     * internal links will use the same compatible theming.
     *
     * Also, transitioning to an external page requires specially configured
     * web servers that allow CORS, which is a pain.
     *
     * Returns LINK_INTERNAL, LINK_EXTERNAL, LINK_POPUP, or LINK_HASH.
     */
    PageTransitionRegion.prototype.is_internal_link = function (url, $a) {
        var extRegex = new RegExp("(\/\/|:)"),
            hashRegex = new RegExp("^#"),
            domainRelativeHashRegex = new RegExp("^" + window.location.pathname + "/#"),
            protRelativeRegex = new RegExp("^//" + window.location.host),
            protAbsoluteRegex = new RegExp('^' + window.location.protocol + "//" + window.location.host),
            protRelativeHashRegex = new RegExp('^//' + window.location.host + window.location.pathname + "#"),
            absoluteHashRegex = new RegExp('^' + window.location.protocol + "//" + window.location.host + window.location.pathname + "#");

        if ($a.attr("target") !== undefined && $a.attr("target") !== "") {
            return PageTransitionRegion.LINK_POPUP;
        }
        
        if (hashRegex.test(url) || absoluteHashRegex.test(url) || protRelativeHashRegex.test(url) || domainRelativeHashRegex.test(url)) {
            return PageTransitionRegion.LINK_HASH;
        } else if (!extRegex.test(url) || protRelativeRegex.test(url) || protAbsoluteRegex.test(url)) {
            return PageTransitionRegion.LINK_INTERNAL;
        } else {
            return PageTransitionRegion.LINK_EXTERNAL;
        }
    };

    /* Transition out the current page.
     *
     * Returns a promise which resolves when the transition has completed.
     *
     * This default implementation uses a CSS class and waits for transitionEnd
     * events.
     */
    PageTransitionRegion.prototype.transition_out = function () {
        var aw;

        this.$elem.removeClass("is-PageTransition--transition_loading");
        this.$elem.addClass("is-PageTransition--transition_out");
        this.$elem.removeClass("is-PageTransition--transition_in");
        aw = new Animations.AnimationWatcher(this.$elem.find("[data-pagetransition-backdrop]"));

        return aw.promise;
    };

    /* Transition to a loading animation.
     *
     * Returns a promise which resolves when the transition has completed.
     *
     * This default implementation uses a CSS class and waits for transitionEnd
     * events.
     */
    PageTransitionRegion.prototype.transition_loading = function () {
        var aw;

        this.$elem.addClass("is-PageTransition--transition_loading");
        this.$elem.removeClass("is-PageTransition--transition_out");
        this.$elem.removeClass("is-PageTransition--transition_in");
        aw = new Animations.AnimationWatcher(this.$elem.find("[data-pagetransition-backdrop]"));

        return aw.promise;
    };

    /* Transition in the current page.
     *
     * Returns a promise which resolves when the transition has completed.
     *
     * This default implementation uses a CSS class and waits for transitionEnd
     * events.
     */
    PageTransitionRegion.prototype.transition_in = function () {
        var aw;

        this.$elem.removeClass("is-PageTransition--transition_loading");
        this.$elem.removeClass("is-PageTransition--transition_out");
        this.$elem.addClass("is-PageTransition--transition_in");
        aw = new Animations.AnimationWatcher(this.$elem.find("[data-pagetransition-backdrop]"));

        return aw.promise;
    };

    /* Transition to the "done" state, which should just have the site be
     * plainly visible.
     *
     * Returns a promise which resolves any final transitions have completed.
     * However, most transition effects should not be starting animations here,
     * so it may never resolve.
     *
     * This default implementation removes all CSS classes and waits for
     * transitionEnd events.
     */
    PageTransitionRegion.prototype.transition_done = function () {
        var aw;

        this.$elem.removeClass("is-PageTransition--transition_loading");
        this.$elem.removeClass("is-PageTransition--transition_out");
        this.$elem.removeClass("is-PageTransition--transition_in");
        aw = new Animations.AnimationWatcher(this.$elem.find("[data-pagetransition-backdrop]"));

        return aw.promise;
    };

    /* Given a URL, actually transition the page to a new page.
     *
     * The default method of transitioning the page is to:
     *
     *   1. AJAX the new page in
     *   2. Transition out the current page
     *   3. Call .replace() to get the new page's content in here.
     *   4. Transition in the new page
     *
     * Subclasses of PageTransitionRegion may implement more complicated
     * behavior based on their own individual requirements. Generally, however,
     * you will want to call .replace() to get the content in.
     *
     * If the replacement fails, we will attempt traditional navigation instead
     * of silently or catastrophically failing.
     */
    PageTransitionRegion.prototype.retrieve_document_by_url = function (url, isPopState) {
        var ajaxPromise = new Promise(function (resolve, reject) {
            $.get(url, undefined, resolve, "html");
        }),
            theData;

        return this.transition_out().then(function () {
            console.log("Out transition finished");
            this.transition_loading();
            return ajaxPromise;
        }.bind(this)).then(function (data) {
            this.prepare_to_replace(this.$elem);
            return new Promise(function (resolve, reject) {
                window.setTimeout(resolve.bind(this, data), 1);
            });
        }.bind(this)).then(function (data) {
            var couldReplace;

            console.log("Load finished");
            theData = data;

            couldReplace = this.can_replace($(theData));
            if (!couldReplace) {
                window.location.href = url;
                throw new Error("Location " + url + " does not have transitionable links!");
            } else if (isPopState !== true) {
                this.replace_state(url);
            }
            
            this.replace($(theData));
            this.replace_head($(theData));
            this.replace_analytics($(theData));
            
            return this.transition_in();
        }.bind(this)).then(function () {
            console.log("In transition finished");
            this.replace_backdrop($(theData));
            this.transition_done();
        }.bind(this));
    };

    /* Link which resolves to the same origin server. */
    PageTransitionRegion.LINK_INTERNAL = 0;

    /* Link which resolves to a different origin server. */
    PageTransitionRegion.LINK_EXTERNAL = 1;

    /* Link which resolves in another window */
    PageTransitionRegion.LINK_POPUP = 2;

    /* Link which resolves to the same page.
     * Also covers links which do JavaScripty things and should be buttons, but
     * aren't because some developers think their pages will always load with
     * the correct JS and don't consider fallback cases
     */
    PageTransitionRegion.LINK_HASH = 3;

    /* Event handler for when a link within the region is clicked.
     */
    PageTransitionRegion.prototype.navigation_intent = function (evt) {
        var $target = $(evt.target), $parent_tgt = $target.parents().filter("a"),
            href;

        if ($target.filter("a").length === 0) {
            $target = $parent_tgt;
        }

        if ($target.filter("a").length === 0) {
            //Not a link.
            return;
        }

        href = $target.attr("href");

        if (this.is_internal_link(href, $target) === PageTransitionRegion.LINK_INTERNAL) {
            //It's AJAX time!
            evt.preventDefault();
            this.retrieve_document_by_url(href);
        }
    };

    /* Event handler for when the user presses the back button. */
    PageTransitionRegion.prototype.pop_state_intent = function (evt) {
        if (evt.originalEvent.state !== undefined &&
                evt.originalEvent.state !== null &&
                evt.originalEvent.state.transition === true) {
            evt.preventDefault();
            this.retrieve_document_by_url(evt.originalEvent.state.url, true);
        }
    };

    Behaviors.register_behavior(PageTransitionRegion);

    module.PageTransitionRegion = PageTransitionRegion;

    return module;
}));
