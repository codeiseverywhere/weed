(function () {
  $(document).ready(function () {
    $(".hpq__m-slider").slick({
      arrows: false,
      draggable: true,
      swipe: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      adaptiveHeight: true,
      asNavFor: ".hpq__m-nav-slider",
    });
    $(".hpq__m-nav-slider").slick({
      slidesToShow: "auto",
      asNavFor: ".hpq__m-slider",
      dots: false,
      arrows: false,
      centerMode: true,
      focusOnSelect: true,
      useTransform: false,
    });
  });
})();
