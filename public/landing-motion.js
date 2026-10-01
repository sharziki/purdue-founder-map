/* Optional landing motion: essential content is visible before this module runs. */
(() => {
  let context;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function stop(){context?.revert();context=null;}
  function start(){
    stop();if(preference.matches || !window.gsap)return;
    try{context=gsap.context(()=>{
      const t=gsap.timeline({defaults:{ease:'power3.out'}});
      t.from('.hero-art>img',{y:12,opacity:.5,duration:1.1},0)
       .from('.hero-copy h1',{y:14,opacity:.65,duration:.8},.05)
       .from('.hero-actions',{y:6,opacity:.6,duration:.6},.15);
    },document.querySelector('.home-hero'));}catch(e){stop();}
  }
  preference.addEventListener('change',start);window.addEventListener('pagehide',stop);window.addEventListener('pageshow',e=>{if(e.persisted)start();});start();
})();
