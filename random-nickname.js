(() => {
  const names=['캐럿','에스쿱스','정한','조슈아','준','호시','원우','우지','디에잇','민규','도겸','승관','버논','디노'];
  const concepts=['별빛','앙코르','우주','멜로디','추억','무대','약속','봄날','기억','하모니','반짝임','여정','노래','꿈','파도','운명','섬광','바람','심장','달빛','새벽','시간','순간','청춘'];
  const adjectives=['반짝이는','설레는','찬란한','다정한','신나는','용감한','빛나는','꿈꾸는','포근한','열정적인','소중한','행복한'];
  const endings=['의 조각','과 함께','의 기록','의 하루','의 모험','의 속삭임'];
  const choose=items=>items[Math.floor(Math.random()*items.length)];
  const recent=new Set();

  const makeNickname=()=>{
    for(let attempt=0;attempt<12;attempt++){
      const name=choose(names);
      const concept=choose(concepts);
      const templates=[
        () => `${name}의 ${concept}`,
        () => `${choose(adjectives)} ${name}`,
        () => `${placeOf(name)}의 ${concept}`,
        () => `${concept} 속 ${name}`,
        () => `${name}${choose(endings)}`,
        () => `${choose(adjectives)} ${concept} ${name}`,
        () => `${name} · ${choose(concepts)}`
      ];
      const candidate=choose(templates)();
      if(!recent.has(candidate)&&candidate.length<=24){
        recent.add(candidate);
        if(recent.size>40)recent.delete(recent.values().next().value);
        return candidate;
      }
    }
    return `${choose(names)}의 ${choose(concepts)}`;
  };

  function placeOf(){
    return choose(['콘서트장','무대 위','하늘 아래','너란 은하','기억 속 바다','세븐틴 마당']);
  }

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
