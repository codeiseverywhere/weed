(function () {
  window.addEventListener("DOMContentLoaded", () => {
    $(document).ready(function () {
      $(".hba__slider").slick({
        arrows: false,
        draggable: true,
        swipe: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: true,
        asNavFor: ".hba__slider-nav",
      });
      $(".hba__slider-nav").slick({
        slidesToShow: "auto",
        asNavFor: ".hba__slider",
        dots: false,
        arrows: false,
        centerMode: true,
        focusOnSelect: true,
        useTransform: false,
      });
    });
  });
})();
