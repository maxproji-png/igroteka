/* Этап 1b: лист, параллакс, живой питомец */
(function(){
  var T=window.T;
  T.closeSheet=function(){document.querySelectorAll('body > .sheet-bg, body > .sheet').forEach(function(n){n.classList.remove('on')});document.body.classList.remove('is-sheet');};
  T.sheet=function(html){var host=document.body,bg=host.querySelector(':scope > .sheet-bg'),sh=host.querySelector(':scope > .sheet');
    var X='<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
    if(!bg){bg=document.createElement('div');bg.className='sheet-bg';host.appendChild(bg);sh=document.createElement('div');sh.className='sheet';sh.setAttribute('role','dialog');host.appendChild(sh);
      bg.addEventListener('click',function(){T.closeSheet()});
      sh.addEventListener('click',function(e){if(e.target.closest('[data-sheet-close]'))T.closeSheet();});}
    var already=sh.classList.contains('on');
    sh.innerHTML='<div class="grab"></div><button type="button" class="ibtn ibtn--round xbtn" data-sheet-close aria-label="Закрыть">'+X+'</button>'+html;
    document.body.classList.add('is-sheet');
    if(already){bg.classList.add('on');sh.classList.add('on');}
    else requestAnimationFrame(function(){bg.classList.add('on');sh.classList.add('on')});};
  // параллакс: слои с data-depth сдвигаются от наклона телефона или курсора
  T.parallax=function(root){var ls=[].slice.call(root.querySelectorAll('[data-depth]'));function set(x,y){ls.forEach(function(l){var d=+l.dataset.depth;l.style.transform='translate3d('+(x*d).toFixed(1)+'px,'+(y*d).toFixed(1)+'px,0)'})}
    root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5)});
    window.addEventListener('deviceorientation',function(e){if(e.gamma==null)return;set(Math.max(-1,Math.min(1,e.gamma/30))*.5,Math.max(-1,Math.min(1,(e.beta-40)/30))*.5)});
    var t0=performance.now();(function idle(){var t=(performance.now()-t0)/1000;if(!root._touched)set(Math.sin(t*.5)*.25,Math.cos(t*.4)*.15);requestAnimationFrame(idle)})();
    root.addEventListener('pointerdown',function(){root._touched=true});};
  T.live=function(el,kind,pose){window.__TAPYSHI_BASE=T.ROOT+'pets/';if(!window.PetViewer)return;el.classList.add('live3d');var v=PetViewer.mount(el,{kind:kind,pose:pose||'neutral'});
    el.addEventListener('click',function(){try{v&&v.tap&&v.tap()}catch(e){}});return v;};
})();
