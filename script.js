window.addEventListener('scroll', function() {
    let header = document.querySelector('.nav-container');
    let windowPosition = window.scrollY > 0;
    header.classList.toggle('scrolling-active-header', windowPosition);
})

window.addEventListener('scroll', function() {
    let header = document.querySelector('.social-header');
    let windowPosition = window.scrollY > 0;
    header.classList.toggle('scrolling-active-social', windowPosition);
})
window.addEventListener('scroll', function() {
    let header = document.querySelector('.white');
    let windowPosition = window.scrollY > 0;
    header.classList.toggle('scrolling-active-white', windowPosition);
})
window.addEventListener('scroll', function() {
    let header = document.querySelector('.black');
    let windowPosition = window.scrollY > 0;
    header.classList.toggle('scrolling-active-black', windowPosition);
})