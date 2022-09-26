(function () {
  window.addEventListener("DOMContentLoaded", () => {
    //--Sticky Add To Cart
    const ATC = document.getElementById("Product__sticky-ATC");
    const form = document.getElementById("Product-form");
    const footer = document.getElementById("SiteFooter");
    let width = window.innerWidth;
    let height = window.innerHeight;
    window.addEventListener("resize", (e) => {
      width = window.innerWidth;
      height = window.innerHeight;
    });
    if (width < 870) {
      window.addEventListener("scroll", (e) => {
        const elRec = form.getBoundingClientRect();
        const footerRec = footer.getBoundingClientRect();

        if (elRec.bottom < 100) {
          ATC.classList.add("Product__sticky-ATC--open");
        } else {
          ATC.classList.remove("Product__sticky-ATC--open");
        }
        if (footerRec.top < height) {
          ATC.classList.remove("Product__sticky-ATC--open");
        }
      });
    }

    //--Size Picker
    const hiddenInputs = document.querySelectorAll(".product-opton");
    const circleOptions = document.querySelectorAll(
      ".Product-details__form-option"
    );
    const optionHandler = (id) => {
      const cID = id;
      circleOptions.forEach((cOption) => {
        const opID = cOption.dataset.key;
        if (cID == opID) {
          cOption.classList.add("Product-selected-option");
          cOption.children[0].style.fontWeight = "700";
        } else {
          cOption.classList.remove("Product-selected-option");
          cOption.children[0].style.fontWeight = "400";
        }
      });
      hiddenInputs.forEach((input) => {
        const iID = input.dataset.key;
        if (cID == iID) {
          input.selected = "selected";
        } else {
          input.selected = "";
        }
      });
    };
    circleOptions.forEach((option) => {
      option.addEventListener("click", (e) =>
        optionHandler(option.dataset.key)
      );
    });
    //--Sliders
    var galleryThumbs = new Swiper(".Product__slider-nav", {
      direction: "vertical",
      spaceBetween: 15,
      slidesPerView: "auto",
      freeMode: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
    });
    var galleryTop = new Swiper(".Product__slider", {
      spaceBetween: 10,
      slidesPerView: "auto",
      centeredSlides: true,
      loop: true,
      thumbs: {
        swiper: galleryThumbs,
      },
      breakpoints: {
        1000: {
          slidesPerView: 1,
        },
      },
    });

    //--Quantity Selector
    const input = document.getElementById("Product-qs-input");
    const placeholder = document.querySelector(".Product-qs-value-text");
    const plus = document.querySelector(".Product-qs-plus");
    const minus = document.querySelector(".Product-qs-minus");
    const incVal = () => {
      let value = input.value;
      const newVal = ++value;
      setNewVals(newVal);
    };
    const decVal = () => {
      let value = input.value;
      const newVal = --value;
      if (newVal < 1) {
        setNewVals(newVal);
      } else {
        setNewVals(newVal);
      }
    };
    const setNewVals = (newVal) => {
      const value = newVal;
      if (value < 1) {
        input.value = 1;
        placeholder.innerHTML = 1;
      } else {
        input.value = value;
        placeholder.innerHTML = value;
      }
    };
    plus.addEventListener("click", incVal);
    minus.addEventListener("click", decVal);

    //--Accordion
    const drawers = document.querySelectorAll(".pd__accordion-drawer");
    const drawerHandler = (id) => {
      const ID = id.split("-")[1];
      drawers.forEach((drawer) => {
        const dID = drawer.id.split("-")[1];
        if (ID == dID) {
          if (drawer.classList.length > 1) {
            closeAllDrawers();
          } else {
            drawer.classList.add("pd__accordion-drawer-open");
          }
        } else {
          drawer.classList.remove("pd__accordion-drawer-open");
        }
      });
    };
    const closeAllDrawers = () => {
      drawers.forEach((drawer) => {
        drawer.classList.remove("pd__accordion-drawer-open");
      });
    };
    drawers.forEach((drawer) => {
      drawer.addEventListener("click", (e) => drawerHandler(drawer.id));
    });

    //Ingredients
    $(document).ready(function () {
      $(".pi__slider").slick({
        arrows: false,
        draggable: true,
        swipe: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        adaptiveHeight: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
        asNavFor: ".pi__slider-nav",
        responsive: [
          {
            breakpoint: 768,
            settings: {
              arrows: false,
              draggable: true,
              swipe: true,
              slidesToShow: 1,
              slidesToScroll: 1,
              adaptiveHeight: true,
              infinite: true,
              autoplay: true,
              autoplaySpeed: 5000,
            },
          },
        ],
      });
      $(".pi__slider-nav").slick({
        slidesToShow: "auto",
        asNavFor: ".pi__slider",
        dots: false,
        arrows: false,
        centerMode: true,
        focusOnSelect: true,
        useTransform: false,
        responsive: [
          {
            breakpoint: 768,
            settings: {
              dots: false,
              arrows: false,
              centerMode: true,
              focusOnSelect: true,
              useTransform: true,
            },
          },
        ],
      });
    });
  });
})();
