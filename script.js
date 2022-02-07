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
    //loader
var loader = document.getElementById("preloader");

window.addEventListener("load", function() {
    loader.style.display = "none";
})

//Scroll
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

$("#aboutmeme").click(function() {
    $('html, body').animate({
        scrollTop: $("#left").offset().top
    }, 500);
});

gsap.registerPlugin(ScrollTrigger);
var tl = gsap.timeline();
tl.from('header', 1.2, {
    x: '-100',
    opacity: 0,
    duration: 1.4,
    ease: Power4.easeOut
})
tl.from('.content', 1.2, {
    x: '-100',
    opacity: 0,
    duration: 1.4,
    ease: Power4.easeOut
})

tl.from('.social-stagger', {
    x: '-30%',
    opacity: 0,
    stagger: .3,
    duration: 1,
    ease: Power4.easeOut
})
tl.from('.nav-stagger', {
    x: '30%',
    opacity: 0,
    stagger: .3,
    duration: 1,
    ease: Power4.easeOut
}, '-=.5')

tl.from('.stagger1', {
    opacity: 0,
    y: -50,
    stagger: .3,
    duration: 2,
    ease: Power4.easeOut
}, '-=1')

tl.from('.hero-design', {
    y: '-50',
    opacity: 0,
    duration: 1,
    ease: Power4.easeOut
})

gsap.from('.hero-anim', {
    stagger: .2,
    scale: 0.1,
    opacity: 0,
    duration: 1,
    ease: Sine.easeOut,
    y: '-500'
})

tl.from('.transition2', {
    ScrollTrigger: {
        trigger: '.transition2',
        start: 'top bottom',
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: Power4.easeOut,
    stagger: .3
})
gsap.from(".uptop", {
    scrollTrigger: {
        trigger: ".uptop",
        start: "top center"
    },
    opacity: 0,
    y: -100
});
gsap.from(".leftleft", {
    scrollTrigger: {
        trigger: ".leftleft",
        start: "top center"
    },
    opacity: 0,
    x: -100
})

gsap.from(".inner-left", {
    scrollTrigger: {
        trigger: ".inner-left",
        start: "top center"
    },
    opacity: 0,
    x: -100
})
gsap.from(".project-images", {
    scrollTrigger: {
        trigger: ".project-images",
        start: "top center"
    },
    opacity: 0,
    ease: Sine.easeIn,
    duration: 1,
    x: 500
})
gsap.from(".footer-ele1", {
    scrollTrigger: {
        trigger: ".footer-ele1",
        start: "top bottom"
    },
    opacity: 0,
    ease: Sine.easeIn,
    duration: 1,
    y: 500
})

var typed = new Typed('.element', {
    strings: ['Student by day, Programmer by Night !^2000', 'Student by day, Digital Artist by Night ! ^2000', 'Student by day, Game Developer by Night ! ^2000'],
    smartBackspace: true, // Default value,
    typeSpeed: 30,
    // time before typing starts
    startDelay: 1200,
    // backspacing speed
    backSpeed: 20,
    // time before backspacing
    backDelay: 500,
    // loop
    loop: true,
    // false = infinite
    loopCount: 5,
    // show cursor
    showCursor: false,
    // character for cursor
    cursorChar: "|",
    // attribute to type (null == text)
    attr: null,
});
import { gsap, Power0, Power1, Power2, Power3, Power4, Linear, Quad, Cubic, Quart, Quint, Strong, Elastic, Back, SteppedEase, Bounce, Sine, Expo, Circ, TweenLite, TimelineLite, TimelineMax } from "./gsap-core.js";
import { CSSPlugin } from "./CSSPlugin.js";
var gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap,
    // to protect from tree shaking
    TweenMaxWithCSS = gsapWithCSS.core.Tween;
export { gsapWithCSS as gsap, gsapWithCSS as default, CSSPlugin, TweenMaxWithCSS as TweenMax, TweenLite, TimelineMax, TimelineLite, Power0, Power1, Power2, Power3, Power4, Linear, Quad, Cubic, Quart, Quint, Strong, Elastic, Back, SteppedEase, Bounce, Sine, Expo, Circ };