(() => {
  const firstWords=['캐럿','에스쿱스','정한','조슈아','준','호시','원우','우지','디에잇','민규','도겸','승관','버논','디노'];
  const secondWords=['별빛','앙코르','우주','멜로디','추억','무대','약속','봄날','기억','하모니','반짝임','여정'];
  const choose=items=>items[Math.floor(Math.random()*items.length)];
  const makeNickname=()=>`${choose(firstWords)}의 ${choose(secondWords)}`;

  function setup(){
    const input=document.getElementById('nickname');
    const label=input?.closest('.nickname-label');
    if(!input||!label)return false;
    if(!document.querySelector('.random-nickname-button')){
      const button=document.createElement('button');
      button.type='button';button.className='random-nickname-button';button.textContent='랜덤 닉네임';
      button.setAttribute('aria-label','닉네임을 랜덤으로 다시 만들기');
      button.addEventListener('click',()=>{
        input.value=makeNickname();
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      label.insertAdjacentElement('afterend',button);
      const style=document.createElement('style');
      style.textContent='.random-nickname-button{display:block;margin:7px 0 12px auto;padding:6px 10px;border:1px solid #ded8ce;border-radius:4px;background:#faf9f6;color:#514b40;font:inherit;font-size:12px;cursor:pointer}.random-nickname-button:hover{background:#f1eee7}';
      document.head.append(style);
    }
    const events=document.getElementById('events');
    const fillIfBlank=()=>{
      if(input.value.trim())return true;
      input.value=makeNickname();
      input.dispatchEvent(new Event('input',{bubbles:true}));
      return true;
    };
    if(events?.children.length)fillIfBlank();
    else if(events){
      const observer=new MutationObserver(()=>{
        if(events.children.length){observer.disconnect();fillIfBlank()}
      });
      observer.observe(events,{childList:true});
      setTimeout(()=>{observer.disconnect();fillIfBlank()},5000);
    }else fillIfBlank();
    return true;
  }

  if(!setup())document.addEventListener('DOMContentLoaded',setup,{once:true});
})();
