/* Paginate.js
 * A progressively-enhancing infinite scroll library
 * ©2014 HUEMOR Designs All Rights Reserved
 */

/*global jQuery, define, console, window, document*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define('depaginate', ['jquery', "Behaviors"], factory);
    } else if (root.jQuery) {
        root.PaginateJS = factory(root.jQuery, root.Behaviors);
    } else {
        console.error("No jQuery found. Load jQuery before this module or use an AMD-compliant loader.");
    }
}(this, function ($, Behaviors) {
    "use strict";
    
    var module = {};
    
    function Pager(elem, page_select_handler) {
        Behaviors.init(Pager, this, arguments);
        
        this.links = {};
        this.current = null;
        this.$pager = $(elem);
        this.min_page_count = Infinity;
        this.max_page_count = 0;
        
        this.$pager.addClass("is-Paginate--managed");

        this.page_select_handler = page_select_handler;

        this.features = this.$pager.data("paginate-features");

        if (this.features === undefined) {
            this.features = "replaceState";
        }

        console.log("Pager Features:" + this.features);
        this.features = this.features.split(" ");
    }
    
    Behaviors.inherit(Pager, Behaviors.Behavior);
    
    Pager.QUERY = "[data-paginate='pager']";
    
    Pager.DEFAULT_LINK = {
        "loaded": false,
        "requested": false,
        "pending": false,
        "current": false
    };
    
    Pager.prototype.is_page_loaded = function (pagenumber) {
        return this.links[pagenumber].loaded;
    };
    
    Pager.prototype.set_current_page = function (pagenumber) {
        var i = 0, pageid;
        
        if (this.current === pagenumber) {
            return;
        }
        
        this.current = pagenumber;
        this.links[pagenumber] = this.links[pagenumber] || $.extend({}, Pager.DEFAULT_LINK);
        
        for (pageid in this.links) {
            if (this.links.hasOwnProperty(pageid)) {
                this.links[pageid].current = pageid === pagenumber;
            }
        }
        
        if (this.links[pagenumber].$pagerContents !== undefined) {
            this.$pager.children().detach();
            this.$pager.append(this.links[pagenumber].$pagerContents);
        }
        
        if (this.links[pagenumber].href !== undefined) {
            if (this.features.indexOf("replaceState") > -1 && window.history.replaceState) {
                window.history.replaceState({transition: true, url: this.links[pagenumber].href}, "", this.links[pagenumber].href);
            }
        }
    };
    
    Pager.prototype.read_pager = function (pagerElem) {
        var $newPager = $(pagerElem),
            pagerThis = this;
        
        $newPager.find("[data-paginate='page']").each(function (index, pageElem) {
            var $newPage = $(pageElem),
                page = $newPage.data("paginate-page"),
                isCurrent = $newPage.data("paginate-current") !== undefined,
                href = $newPage.attr("href");
            
            pagerThis.links[page] = pagerThis.links[page] || $.extend({}, Pager.DEFAULT_LINK);
            
            pagerThis.links[page].href = href || pagerThis.links[page].href;
            pagerThis.links[page].current = isCurrent;
            
            if (isCurrent) {
                pagerThis.current = page;
            }
            
            if (pagerThis.links[page].pending) {
                pagerThis.load_page(page);
            }
            
            if (page > pagerThis.max_page_count) {
                pagerThis.max_page_count = page;
            }
            
            if (page < pagerThis.min_page_count) {
                pagerThis.min_page_count = page;
            }

            $newPage.on("click", function (evt) {
                evt.preventDefault();

                if (pagerThis.page_select_handler) {
                    pagerThis.page_select_handler(pagerThis, page);
                }
            });
        });
        
        this.links[this.current] = this.links[this.current] || $.extend({}, Pager.DEFAULT_LINK);
        this.links[this.current].$pagerContents = $newPager.children();
        
        if (this.links[this.current].$pagerContents !== undefined) {
            this.$pager.children().detach();
            this.$pager.append(this.links[this.current].$pagerContents);
        }
    };
    
    Pager.prototype.load_page = function (pagenumber, on_success, on_failure) {
        var paginateThis = this;
        
        if (this.links[pagenumber] === undefined || this.links[pagenumber].href === undefined) {
            this.links[pagenumber] = $.extend({}, this.links[pagenumber], Pager.DEFAULT_LINK);
            this.links[pagenumber].pending = true;
            this.links[pagenumber].on_success = on_success || this.links[pagenumber].on_success;
            this.links[pagenumber].on_failure = on_failure || this.links[pagenumber].on_failure;
            
            return;
        }
        
        if (this.links[pagenumber].requested || this.links[pagenumber].loaded) {
            return;
        }
        
        this.links[pagenumber].pending = false;
        this.links[pagenumber].requested = true;
        
        $.ajax({
            "url": this.links[pagenumber].href,
            "dataType": "html"
        }).done(function (data, textStatus, jqXHR) {
            if (paginateThis.links[pagenumber].on_success !== undefined) {
                paginateThis.links[pagenumber].on_success(data, textStatus, jqXHR);
            }
            
            if (on_success !== undefined) {
                on_success(data, textStatus, jqXHR);
            }
            
            paginateThis.links[pagenumber].loaded = true;
        }).fail(function (jqXHR, textStatus, errorThrown) {
            if (paginateThis.links[pagenumber].on_failure !== undefined) {
                paginateThis.links[pagenumber].on_failure(jqXHR, textStatus, errorThrown);
            }
            
            if (on_failure !== undefined) {
                on_failure(jqXHR, textStatus, errorThrown);
            }
        });
    };
    
    Pager.prototype.is_first_page = function (test_page) {
        return (test_page !== null && test_page === this.min_page_count);
    };
    
    Pager.prototype.is_last_page = function (test_page) {
        return (test_page !== null && test_page === this.max_page_count);
    };
    
    module.Pager = Pager;
    
    function Region(elem, on_region_scrolled) {
        var $extantRegion = $(elem);
        Behaviors.init(Region, this, arguments);
        
        this.name = $extantRegion.data("paginate-region");

        this.load_methods = $extantRegion.data("paginate-methods");

        if (this.load_methods === undefined) {
            this.load_methods = "scroll";
        }

        console.log("LoadMethods:" + this.load_methods);
        this.load_methods = this.load_methods.split(" ");

        this.features = $extantRegion.data("paginate-features");

        if (this.features === undefined) {
            this.features = "scrollOnLoad";
        }

        console.log("Region Features:" + this.features);
        this.features = this.features.split(" ");
        
        this.pages = {};
        this.pagenumbers = [];
        
        this.min_page_loaded = Infinity;
        this.max_page_loaded = 0;
        
        this.$region = $extantRegion;
        
        this.$parentScroller = null;
        this.lastScrollTop = 0;
        
        this.on_region_scrolled = on_region_scrolled;
        
        this.$region.addClass("is-Paginate--managed");
    }
    
    Behaviors.inherit(Region, Behaviors.Behavior);
    
    Region.QUERY = "[data-paginate='region']";
    
    /* Called to append a new page to the region.
     * 
     * Region contents will be extracted from the given region element and
     * appended to the existing region, such that any existing content belonging
     * to pages marked with a lower page number will appear before your page
     * content, and any existing content belonging to pages marked with a higher
     * page number will appear after your page content.
     * 
     * Already inserted pages will not be reinserted into the region.
     * 
     * As this function inserts content into the page, it will be presented to
     * Behaviors to ensure any Behaviors on the new page content can locate
     * correctly.
     * 
     * An event will be fired from the region's element called depaginate_load
     * which serves to indicate when a new page has loaded. Do not use this
     * event to check if new content has been added to the page, use Behaviors'
     * register_behavior or register_content_listener functions instead. This
     * event will be called before behaviors have been located on their
     * elements.
     */
    Region.prototype.read_page_region = function (pageNumber, regionElem) {
        var $newRegion = $(regionElem),
            itemSelector = $newRegion.data("paginate-selector") || "> *",
            prevPageNumberId = 0,
            nextPageNumberId = this.pagenumbers.length,
            nextPageNumber,
            prevPageNumber,
            pageAlreadyExists = false,
            i = 0,
            $newItems = $newRegion.find(itemSelector),
            $firstItem = $newItems.first(),
            $lastItem = $newItems.last(),
            oldPageTop = 0,
            newPageTop = 0,
            evt;
        
        if (this.firstVisiblePage !== undefined) {
            oldPageTop = this.page_top_position(this.firstVisiblePage);
        }

        for (i = 0; i < this.pagenumbers.length; i += 1) {
            if (this.pagenumbers[i] < pageNumber) {
                prevPageNumberId = i;
                prevPageNumber = this.pagenumbers[i];
            } else if (this.pagenumbers[i] === pageNumber) {
                pageAlreadyExists = true;
            } else {
                nextPageNumber = this.pagenumbers[i];
                nextPageNumberId = i;
                break;
            }
        }
        
        if (!pageAlreadyExists) {
            this.pagenumbers.splice(nextPageNumberId, 0, pageNumber);
            
            if (this.pages[prevPageNumber] !== undefined) {
                $newItems = $newItems.insertAfter(this.pages[prevPageNumber].$lastItem);
            } else if (this.pages[nextPageNumber] !== undefined) {
                $newItems = $newItems.insertBefore(this.pages[nextPageNumber].$firstItem);
            } //else do nothing since this obviously must be the original region
            
            $firstItem = $newItems.first();
            $lastItem = $newItems.last();
            
            this.pages[pageNumber] = this.pages[pageNumber] || {};
            this.pages[pageNumber].$newItems = $newItems;
            this.pages[pageNumber].$firstItem = $firstItem;
            this.pages[pageNumber].$lastItem = $lastItem;

            evt = jQuery.Event("depaginate_load");
            evt.region = this;
            evt.target = this.$region[0];
            evt.$newItems = $newItems;

            this.$region.trigger(evt);
            
            Behaviors.content_ready($newItems);
        }
        
        if (pageNumber < this.min_page_loaded) {
            this.min_page_loaded = pageNumber;
        }
        
        if (pageNumber > this.max_page_loaded) {
            this.max_page_loaded = pageNumber;
        }

        if (this.firstVisiblePage !== undefined) {
            newPageTop = this.page_top_position(this.firstVisiblePage);

            if (this.features.indexOf("scrollOnLoad") > -1) {
                window.setTimeout(
                    this.scroll_by_delta.bind(this, newPageTop - oldPageTop),
                    50
                );
            }
        }
    };
    
    Region.prototype.register_scroll_handler = function () {
        var cssOverflowX,
            regionThis = this;
        
        if (this.$parentScroller !== null) {
            this.$parentScroller.off("scroll.paginate");
        }

        this.$parentScroller = this.$region;

        while (this.$parentScroller.length !== 0 && this.$parentScroller.get(0) !== document) {
            cssOverflowX = this.$parentScroller.css("overflow-x");

            if (cssOverflowX === "visible" || cssOverflowX === "hidden") {
                this.$parentScroller = this.$parentScroller.parent();
            } else {
                break;
            }
        }
        
        regionThis.on_scroll({"target": this.$parentScroller[0]});
        this.$parentScroller.on("scroll.paginate", function (evt) {
            regionThis.on_scroll(evt);
        });

        this.lastScrollTop = this.$parentScroller.scrollTop();
    };
    
    Region.prototype.on_scroll = function (evt) {
        var $target = $(evt.target),
            scrollTop = $target.scrollTop(),
            scrollBottom = scrollTop + (evt.target !== document ? $target.height() : $(window).height()),
            targetTop = evt.target !== document ? $target.position().top : 0,
            targetAdjust = evt.target !== document ? scrollTop : 0,
            i = 0,
            firstVisibleTop = null,
            firstVisiblePage = null,
            lastVisiblePage = null,
            lastVisibleBottom = null,
            scrollDelta = scrollTop - this.lastScrollTop,
            stopOuterLoopSentinel = false,
            regionThis = this;
        
        this.lastScrollTop = scrollDelta;
        
        function pageEach(index, itemElem) {
            var $itemElem = $(itemElem),
                itemTop = targetAdjust + $itemElem.position().top - targetTop,
                itemBottom = itemTop + $itemElem.height(),
                isVisible = (scrollTop <= itemTop && itemTop <= scrollBottom) ||
                            (scrollTop <= itemBottom && itemBottom <= scrollBottom) ||
                            (itemTop <= scrollTop && scrollBottom <= itemBottom);
            
            if (!isVisible) {
                if (lastVisiblePage !== null) {
                    stopOuterLoopSentinel = true;
                }

                return true;
            }

            if (firstVisiblePage === null) {
                firstVisiblePage = regionThis.pagenumbers[i];
                firstVisibleTop = itemTop;
            }
            
            lastVisiblePage = regionThis.pagenumbers[i];
            lastVisibleBottom = itemTop + $itemElem.height();

            return false;
        }
        
        //Determine what pages are visible now
        if (this.pagenumbers.length === 0) {
            console.log("There are no page numbers.");
        }
        
        for (i = 0; i < this.pagenumbers.length; i += 1) {
            if (this.pages[this.pagenumbers[i]].$newItems === 0) {
                console.log("There are no pages within page " + this.pagenumbers[i]);
            }
            
            this.pages[this.pagenumbers[i]].$newItems.each(pageEach);
            
            if (stopOuterLoopSentinel) {
                stopOuterLoopSentinel = false;
                break;
            }
        }
        
        if (firstVisiblePage === null) {
            console.log("First visible page did NOT get set. Dropping the scroll event.");
            return;
        }
        
        this.firstVisiblePage = firstVisiblePage;
        this.lastVisiblePage = lastVisiblePage;
        this.firstVisibleTop = firstVisibleTop;
        this.lastVisibleBottom = lastVisibleBottom;

        if (this.load_methods.indexOf("scroll") > -1) {
            this.on_region_scrolled(this, scrollTop, scrollBottom, scrollDelta, firstVisiblePage, lastVisiblePage, firstVisibleTop, lastVisibleBottom);
        }
    };
    
    Region.prototype.first_loaded_page = function () {
        return this.min_page_loaded;
    };
    
    Region.prototype.last_loaded_page = function () {
        return this.max_page_loaded;
    };
    
    Region.prototype.set_additional_content_indicators = function (has_next_page, has_prev_page) {
        if (has_next_page) {
            this.$region.addClass("is-Paginate--has_next_page");
            this.$region.removeClass("is-Paginate--no_next_page");
        } else {
            this.$region.removeClass("is-Paginate--has_next_page");
            this.$region.addClass("is-Paginate--no_next_page");
        }
        
        if (has_prev_page) {
            this.$region.addClass("is-Paginate--has_prev_page");
            this.$region.removeClass("is-Paginate--no_prev_page");
        } else {
            this.$region.removeClass("is-Paginate--has_prev_page");
            this.$region.addClass("is-Paginate--no_prev_page");
        }
    };
    
    /* Returns the position of the top of a particular page.
     */
    Region.prototype.page_top_position = function (pagenumber) {
        var page = this.pages[pagenumber],
            $firstItem,
            measuredOffset,
            $parentScroller = this.$parentScroller,
            scrollerOffset = 0,
            encounteredScroller = false;
        
        if (page === undefined) {
            console.log("Missing page: " + pagenumber);
            console.log(this.pages);
            
            if (pagenumber < this.min_page_loaded || pagenumber === null) {
                pagenumber = this.min_page_loaded;
            }
            
            if (pagenumber > this.max_page_loaded) {
                pagenumber = this.max_page_loaded;
            }
            
            page = this.pages[pagenumber];
        }
        
        $firstItem = page.$firstItem;
        measuredOffset = $firstItem.offset().top;
        if ($parentScroller[0] !== document) {
            scrollerOffset = $parentScroller.offset().top;
        }
        
        return measuredOffset - scrollerOffset;
    };
    
    /* Scroll the region by a particular delta. */
    Region.prototype.scroll_by_delta = function (scrollDelta) {
        var $parentScroller = this.$parentScroller;
        
        $parentScroller.scrollTop($parentScroller.scrollTop() + scrollDelta);
    };
    
    Region.prototype.scroll_absolutely = function (scrollAbs) {
        var $parentScroller = this.$parentScroller;
        
        $parentScroller.scrollTop(scrollAbs);
    };
    
    module.Region = Region;
    
    function Paginate(elem) {
        var $extantPager = $(elem).find(Pager.QUERY),
            $extantRegions = $(elem).find(Region.QUERY),
            currentPage = $(elem).data("paginate-page"),
            paginateThis = this;
        
        Behaviors.init(Paginate, this, arguments);
        
        if ($extantPager.length === 0) {
            console.error("No pager was found in this paginage instance.");
            return;
        }
        
        if (this.$elem.attr('id') === undefined) {
            console.error("This paginate needs an id before it can be used.");
            return;
        }
        
        console.log("page: " + currentPage);
        
        this.$context = $(elem);
        this.id = this.$context.attr("id");
        
        function pshClosure() {
            paginateThis.page_select_handler.apply(paginateThis, arguments);
        }

        this.pager = Pager.locate($extantPager.get(0), pshClosure);
        
        if ($extantPager.data("paginate-count") === 1) {
            console.log("Not activating depaginate on a region with only one page.");
            return;
        }
        
        this.pager.set_current_page(currentPage);
        this.pager.read_pager($extantPager.get(0));
        
        this.regions = {};
        this.regionNames = [];
        
        this.currentPage = currentPage;
        
        function orsClosure() {
            paginateThis.on_region_scrolled.apply(paginateThis, arguments);
        }
        
        this.features = $extantPager.data("paginate-features");

        if (this.features === undefined) {
            this.features = "backScroll";
        }

        console.log("Paginate Features:" + this.features);
        this.features = this.features.split(" ");

        $extantRegions.each(function (index, elem) {
            var $extantRegion = $(elem),
                regionName = $extantRegion.data("paginate-region"),
                region,
                currentPage = paginateThis.currentPage;
            
            console.log("page: " + currentPage);
            
            function scrollBack() {
                console.log("Scrolling back the user to " + region.page_top_position(currentPage) + " (page: " + currentPage + ")");
                region.scroll_absolutely(region.page_top_position(currentPage));
            }
            
            paginateThis.regionNames.push(regionName);
            
            region = paginateThis.regions[regionName] || Region.locate(elem, orsClosure);
            paginateThis.regions[regionName] = region;
            
            region.read_page_region(currentPage, elem);
            region.register_scroll_handler();
            
            paginateThis.update_region_indicators(region);
            
            if (!paginateThis.pager.is_first_page(currentPage) && paginateThis.features.indexOf("backScroll") > -1) {
                //User pressed back button, scroll the region into view
                
                $(document).ready(scrollBack);
                $(window).on("load", function () {
                    window.setTimeout(scrollBack, 1500);
                });
            }
        });
    }
    
    Behaviors.inherit(Paginate, Behaviors.Behavior);
    
    Paginate.QUERY = "[data-paginate='paginate']";
    
    Paginate.prototype.page_load_success = function (data, textStatus, jqXHR) {
        var $data = $(data),
            i = 0,
            $dataPaginate,
            $dataRegion,
            $dataPager,
            region = null,
            paginateThis = this,
            next_page = 0;

        $dataPaginate = $data.find("#" + this.id);
        
        if ($dataPaginate.length === 0) {
            $dataPaginate = $data.filter("#" + this.id);
        }
        
        if ($dataPaginate.length === 0) {
            console.error("DEPAGINATE: The paginate context with ID " + this.id + " could not be found in the loaded page. Errors may result.");
        }
        
        next_page = $dataPaginate.data("paginate-page");

        for (i = 0; i < this.regionNames.length; i += 1) {
            $dataRegion = $dataPaginate.find("[data-paginate-region='" + this.regionNames[i] + "']");

            if ($dataRegion.length > 0) {
                region = this.regions[this.regionNames[i]];
                region.read_page_region(next_page, $dataRegion[0]);
            }
        }

        $dataPager = $dataPaginate.find(Pager.QUERY);
        $dataPager.each(function (index, pagerElem) {
            paginateThis.pager.read_pager(pagerElem);
        });

        this.pager.set_current_page(next_page);
        this.update_region_indicators(region);
    };

    Paginate.prototype.page_select_handler = function (pager, pagenumber) {
        var paginateThis = this;
        if (this.pager.is_page_loaded(pagenumber)) {
            return;
        }

        function on_success() {
            paginateThis.page_load_success.apply(paginateThis, arguments);
        }

        this.pager.load_page(pagenumber, on_success);
    };

    Paginate.prototype.on_region_scrolled = function (region, scrollTop, scrollBottom, scrollDelta, firstVisiblePage, lastVisiblePage, firstVisibleTop, lastVisibleBottom) {
        var visible_range = lastVisibleBottom - firstVisibleTop,
            visible_pagerange = lastVisiblePage - firstVisiblePage,
            average_page_size = visible_range / visible_pagerange,
            scroll_direction_down = scrollDelta > 0,
            should_load_page,
            next_page,
            paginateThis = this;
        
        function on_success() {
            paginateThis.page_load_success.apply(paginateThis, arguments);
        }
        
        if (scroll_direction_down) {
            should_load_page = scrollBottom + scrollDelta >= lastVisibleBottom;
            next_page = lastVisiblePage + 1;
            
            this.pager.set_current_page(lastVisiblePage);
        } else {
            should_load_page = scrollTop + scrollDelta < firstVisibleTop;
            next_page = firstVisiblePage - 1;
            
            this.pager.set_current_page(firstVisiblePage);
        }
        
        if (next_page < 0) {
            return;
        }
        
        if (should_load_page) {
            this.pager.load_page(next_page, on_success);
        }
    };
    
    Paginate.prototype.update_region_indicators = function (region) {
        region.set_additional_content_indicators(
            !this.pager.is_last_page(region.last_loaded_page()),
            !this.pager.is_first_page(region.first_loaded_page())
        );
    };
    
    module.Paginate = Paginate;
    
    Behaviors.register_behavior(Paginate);
    
    return module;
}));