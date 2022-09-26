(function(){

  window.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.Hero__slide');
  const toggles = document.querySelectorAll('.Hero__nav-item');
  const slideCount = slides.length;
  

  const autoplayHandler = id => {
    slides.forEach(slide => {
        const slideID = slide.id.split('-')[3];
        if(id == slideID){
          slide.classList.add('Hero-selected-slide');
        } else {
          slide.classList.remove('Hero-selected-slide')
          
        }
      });
      toggles.forEach(toggle => {
        const toggleID = toggle.id.split('-')[4];
        if(id == toggleID){
          toggle.classList.add('Hero_nav-item-selected')
        } else {
          toggle.classList.remove('Hero_nav-item-selected')
        }
      })
  }
  

  const slideHandler = (e, id) => {
    e.preventDefault();
    slides.forEach(slide => {
        const slideID = slide.id.split('-')[3];
        if(id === slideID){
          slide.classList.add('Hero-selected-slide');
          
        } else {
          slide.classList.remove('Hero-selected-slide')
        }
      });
      toggles.forEach(toggle => {
        const toggleID = toggle.id.split('-')[4];
        if(id === toggleID){
          toggle.classList.add('Hero_nav-item-selected');
        } else {
          toggle.classList.remove('Hero_nav-item-selected')
        }
      })
      i = id;
  }

  let i = 0;
  const counterHandler = () => {
    if(i == 3){
      i = 1;
    } else {
      i++;
    }
     autoplayHandler(i);
  }
  //let myInt = setInterval(() => {
    //counterHandler()
  //}, 6500)
  

  toggles.forEach(toggle => {
    const toggleID = toggle.id.split('-')[4];
    toggle.addEventListener('click', (e) => slideHandler(e, toggleID))
  });
  });
}());