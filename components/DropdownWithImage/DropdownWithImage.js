(function () {
  //this feature of this section not currently in use. when dropdown code is is made active, this code should be made active as well.
  // window.addEventListener("DOMContentLoaded", () => {
  //   const placeholderWrapper = document.querySelector(
  //     ".dwi__dropdown-placeholder"
  //   );
  //   const outerMost = document.querySelector(".dwi__dropdown");
  //   const placeholderText = document.querySelector(".dwi__option-text");
  //   const dropDownWrapper = document.querySelector(".dwi__dropdown-options");
  //   const arrow = document.querySelector(".dwi__arrow");
  //   const options = document.querySelectorAll(".dwi__dropdown-option");
  //   //Set Selected Option to LocalStorage to reference later
  //   const setLocalStorage = (value) => {
  //     localStorage.setItem("q1", value);
  //   };
  //   //Set initial value to option placeholder
  //   placeholderText.innerHTML = options[0].innerHTML;
  //   //Set initial value to LocalStorage
  //   let initValue = options[0].dataset.option;
  //   setLocalStorage(initValue);
  //   //Update value of option placeholder
  //   const selectedOptionHandler = (id, html, value) => {
  //     const text = html;
  //     placeholderText.innerHTML = text;
  //     statusHandler();
  //     setLocalStorage(value);
  //   };
  //   options.forEach((option) => {
  //     let id = option.id.split("-")[1];
  //     let html = option.innerHTML;
  //     let value = option.dataset.option;
  //     option.addEventListener(
  //       "click",
  //       (e) => {
  //         selectedOptionHandler(id, html, value);
  //       },
  //       { capture: true }
  //     );
  //   });
  //   //Drop and Raise DropDown
  //   let dropDownStatus = "closed";
  //   const statusHandler = () => {
  //     const secondClass = dropDownWrapper.classList[1];
  //     if (secondClass === "dwi__dropdown-closed") {
  //       dropDownStatus = "closed";
  //     } else {
  //       dropDownStatus = "open";
  //     }
  //     dropDownHandler();
  //   };
  //   const dropDownHandler = () => {
  //     if (dropDownStatus === "closed") {
  //       dropDownWrapper.classList.remove("dwi__dropdown-closed");
  //       dropDownWrapper.classList.add("dwi__dropdown-open");
  //       arrow.classList.add("dwi__flip-arrow");
  //     } else if (dropDownStatus === "open") {
  //       dropDownWrapper.classList.add("dwi__dropdown-closed");
  //       dropDownWrapper.classList.remove("dwi__dropdown-open");
  //       arrow.classList.remove("dwi__flip-arrow");
  //     }
  //   };
  //   const closeDropDown = () => {
  //     dropDownWrapper.classList.add("dwi__dropdown-closed");
  //     dropDownWrapper.classList.remove("dwi__dropdown-open");
  //     arrow.classList.remove("dwi__flip-arrow");
  //     dropDownStatus = "closed";
  //   };
  //   placeholderWrapper.addEventListener("click", statusHandler);
  //   outerMost.addEventListener("mouseleave", closeDropDown);
  // });
})();
